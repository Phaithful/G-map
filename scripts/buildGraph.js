// scripts/buildGraph.js
// Converts a GeoJSON FeatureCollection of LineStrings into campusGraph.json
// Usage: node scripts/buildGraph.js

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const MERGE_THRESHOLD_M = 6.0; // merge nodes closer than this

function haversineMeters(a, b) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const φ1 = toRad(a.lat);
  const φ2 = toRad(b.lat);
  const dφ = toRad(b.lat - a.lat);
  const dλ = toRad(b.lng - a.lng);
  const x =
    Math.sin(dφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(dλ / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

// --- Load GeoJSON ----------------------------------------------------------------
const geojsonPath = resolve(__dirname, "../godfrey_map.geojson");
const geojson = JSON.parse(readFileSync(geojsonPath, "utf-8"));

// Collect all LineString coordinate arrays
const lines = [];
for (const feature of geojson.features) {
  const g = feature.geometry;
  if (g.type === "LineString") {
    lines.push(g.coordinates); // [[lng,lat], ...]
  } else if (g.type === "MultiLineString") {
    for (const coords of g.coordinates) lines.push(coords);
  }
}

if (lines.length === 0) {
  console.error("No LineString features found in GeoJSON.");
  process.exit(1);
}

// --- Build raw node list from all line coordinates ------------------------------
const rawNodes = []; // {lng, lat}
const lineNodeRanges = []; // [{start, end}] for each line

for (const coords of lines) {
  const start = rawNodes.length;
  for (const [lng, lat] of coords) {
    rawNodes.push({ lng, lat });
  }
  lineNodeRanges.push({ start, end: rawNodes.length - 1 });
}

// --- Merge nearby nodes (within MERGE_THRESHOLD_M) ----------------------------
// Maps rawNode index → canonical node index
const canonicalId = new Array(rawNodes.length).fill(-1);
const mergedNodes = []; // {lng, lat}

for (let i = 0; i < rawNodes.length; i++) {
  if (canonicalId[i] !== -1) continue; // already merged into something

  // Check if this node is close to an already-accepted node
  let merged = false;
  for (let j = 0; j < mergedNodes.length; j++) {
    if (haversineMeters(rawNodes[i], mergedNodes[j]) <= MERGE_THRESHOLD_M) {
      canonicalId[i] = j;
      merged = true;
      break;
    }
  }

  if (!merged) {
    canonicalId[i] = mergedNodes.length;
    mergedNodes.push({ ...rawNodes[i] });
  }
}

// --- Build edges from each line ------------------------------------------------
const edgeSet = new Map(); // "from-to" -> weight (keep shortest)

function addEdge(fromRaw, toRaw) {
  const from = canonicalId[fromRaw];
  const to = canonicalId[toRaw];
  if (from === to) return; // same node after merge

  const w = haversineMeters(rawNodes[fromRaw], rawNodes[toRaw]);

  for (const [a, b] of [
    [from, to],
    [to, from],
  ]) {
    const key = `${a}-${b}`;
    const existing = edgeSet.get(key);
    if (existing === undefined || w < existing) {
      edgeSet.set(key, w);
    }
  }
}

for (let li = 0; li < lines.length; li++) {
  const { start, end } = lineNodeRanges[li];
  for (let i = start; i < end; i++) {
    addEdge(i, i + 1);
  }
}

// --- Format output ------------------------------------------------------------
const nodes = mergedNodes.map((n, id) => ({ id, lng: n.lng, lat: n.lat }));
const edges = [];
for (const [key, w] of edgeSet.entries()) {
  const [from, to] = key.split("-").map(Number);
  edges.push({ from, to, w });
}

const output = {
  meta: {
    name: "G-Map Campus Walk Graph",
    source: "godfrey_map.geojson",
    merge_threshold_m: MERGE_THRESHOLD_M,
    node_count: nodes.length,
    directed_edges: edges.length,
  },
  nodes,
  edges,
};

const outPath = resolve(__dirname, "../src/data/campusGraph.json");
writeFileSync(outPath, JSON.stringify(output, null, 2));

console.log(`✓ Wrote campusGraph.json`);
console.log(`  Nodes : ${nodes.length}`);
console.log(`  Edges : ${edges.length}`);
console.log(
  `  Lat   : ${Math.min(...nodes.map((n) => n.lat)).toFixed(7)} → ${Math.max(...nodes.map((n) => n.lat)).toFixed(7)}`
);
console.log(
  `  Lng   : ${Math.min(...nodes.map((n) => n.lng)).toFixed(7)} → ${Math.max(...nodes.map((n) => n.lng)).toFixed(7)}`
);
