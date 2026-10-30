import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error("Usage: node convert_any_ppm.mjs input.ppm output.png");
  process.exit(1);
}

const data = readFileSync(input);
const header = /^P6\s+(?:#.*\s+)*(\d+)\s+(\d+)\s+255\s/.exec(
  data.toString("ascii", 0, Math.min(data.length, 200))
);
if (!header) throw new Error("Unsupported PPM format.");

const width = Number(header[1]);
const height = Number(header[2]);
const start = Buffer.from(header[0], "ascii").length;
const rgb = data.subarray(start, start + width * height * 3);
if (rgb.length !== width * height * 3) throw new Error("Incomplete PPM.");

const crc32 = (buf) => {
  let crc = 0xffffffff;
  for (const byte of buf) {
    crc ^= byte;
    for (let k = 0; k < 8; k++)
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const chunk = (type, body) => {
  const payload = Buffer.concat([Buffer.from(type), body]);
  const out = Buffer.alloc(payload.length + 8);
  out.writeUInt32BE(body.length, 0);
  payload.copy(out, 4);
  out.writeUInt32BE(crc32(payload), payload.length + 4);
  return out;
};

const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(width, 0);
ihdr.writeUInt32BE(height, 4);
ihdr[8] = 8;
ihdr[9] = 2;

const rows = Buffer.alloc(height * (width * 3 + 1));
for (let y = 0; y < height; y++) {
  const dst = y * (width * 3 + 1);
  rows[dst] = 0;
  rgb.copy(rows, dst + 1, y * width * 3, (y + 1) * width * 3);
}

const png = Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk("IHDR", ihdr),
  chunk("IDAT", zlib.deflateSync(rows)),
  chunk("IEND", Buffer.alloc(0))
]);

writeFileSync(output, png);
console.log(`Converted ${width}x${height}: ${input} -> ${output}`);
