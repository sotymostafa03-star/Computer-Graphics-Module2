import { readFileSync, writeFileSync } from "node:fs";

const plan = JSON.parse(readFileSync("myplan.json", "utf8"));
const W = 1000, H = 850, pad = 35;
const xs = plan.polylines.flatMap(p => p.points.map(v => v[0]));
const ys = plan.polylines.flatMap(p => p.points.map(v => v[1]));
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minY = Math.min(...ys), maxY = Math.max(...ys);
const scale = Math.min((W - 2 * pad) / (maxX - minX), (H - 2 * pad) / (maxY - minY));
const sx = x => pad + (x - minX) * scale;
const sy = y => H - pad - (y - minY) * scale;

const colors = {
  wall: "#440154",
  cella: "#3b528b",
  stair: "#21918c",
  shrine: "#5ec962",
  axis: "#fde725"
};

let shapes = "";
for (const pl of plan.polylines) {
  const points = pl.points.map(([x,y]) => `${sx(x)},${sy(y)}`).join(" ");
  shapes += `<polyline points="${points}" fill="none" stroke="${colors[pl.category] || "white"}" stroke-width="2.5" ${pl.closed ? 'stroke-linejoin="round"' : 'stroke-linecap="round"'} />\n`;
}
const silhouette = plan.silhouette?.points;
if (silhouette) {
  const pts = silhouette.map(([x,y]) => `${sx(x)},${sy(y)}`).join(" ");
  shapes = `<polygon points="${pts}" fill="#e6ecf5" />\n` + shapes;
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="100%" height="100%" fill="#121216"/>
<text x="35" y="25" fill="white" font-family="Arial" font-size="16">Angkor Wat — schematic preview</text>
${shapes}
</svg>`;

writeFileSync("out/angkor_wat_preview.svg", svg);
console.log("Created out/angkor_wat_preview.svg");
