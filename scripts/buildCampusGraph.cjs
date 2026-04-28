// Builds a walkable routing graph from campus building footprint polygons.
// Uses "main campus 1.geojson" as the campus boundary and all other building
// polygons as obstacles. Generates a grid of walkable nodes inside the campus,
// connects them with 8-directional edges (skipping any that cross a building wall),
// and appends one centroid node per building as the arrival destination.
//
// Run: node scripts/buildCampusGraph.cjs

const fs = require("fs");
const path = require("path");

// ===== Config =====
const BUILDINGS_DIR = path.join(__dirname, "../public/buildings.geojson");
const OUTPUT = path.join(__dirname, "../src/data/campusGraph.json");
const CAMPUS_FILE = "main campus 1.geojson";
// These are area/path features, not building footprints
const SKIP = new Set(["main campus 1.geojson", "free area.geojson", "registerline.geojson"]);
// Grid spacing in degrees — ~8 m at this latitude
const D_LAT = 0.000072;
const D_LNG = 0.0000724;

// ===== Geometry =====

function haversineM(a, b) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}

// Ray-casting point-in-polygon. ring = [[lng,lat], ...]
function pip(lng, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    if ((yi > lat) !== (yj > lat) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}

// Strict segment intersection (t,u both in (0.01, 0.99) — excludes shared endpoints)
function segsIntersect(a1, a2, b1, b2) {
  const dx1 = a2[0] - a1[0], dy1 = a2[1] - a1[1];
  const dx2 = b2[0] - b1[0], dy2 = b2[1] - b1[1];
  const denom = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(denom) < 1e-15) return false;
  const t = ((b1[0] - a1[0]) * dy2 - (b1[1] - a1[1]) * dx2) / denom;
  const u = ((b1[0] - a1[0]) * dy1 - (b1[1] - a1[1]) * dx1) / denom;
  return t > 0.01 && t < 0.99 && u > 0.01 && u < 0.99;
}

// Does the segment a→b cross any wall of any building?
function crossesBuilding(a, b, buildingRings) {
  const p1 = [a.lng, a.lat];
  const p2 = [b.lng, b.lat];
  for (const ring of buildingRings) {
    for (let i = 0; i < ring.length - 1; i++) {
      if (segsIntersect(p1, p2, ring[i], ring[i + 1])) return true;
    }
  }
  return false;
}

// Centroid of a closed polygon ring (excludes the repeated closing point)
function centroid(ring) {
  const n = ring.length - 1;
  let lng = 0, lat = 0;
  for (let i = 0; i < n; i++) { lng += ring[i][0]; lat += ring[i][1]; }
  return { lng: lng / n, lat: lat / n };
}

// ===== Load data =====

const campusData = JSON.parse(fs.readFileSync(path.join(BUILDINGS_DIR, CAMPUS_FILE), "utf8"));
const campusRing = campusData.features[0].geometry.coordinates[0];

const buildingFiles = fs
  .readdirSync(BUILDINGS_DIR)
  .filter((f) => f.endsWith(".geojson") && !SKIP.has(f));

const buildingRings = [];
const buildingInfo = []; // { ring, name }

for (const file of buildingFiles) {
  const data = JSON.parse(fs.readFileSync(path.join(BUILDINGS_DIR, file), "utf8"));
  const name = file.replace(".geojson", "");
  for (const feat of data.features || []) {
    if (feat.geometry.type !== "Polygon") continue;
    const ring = feat.geometry.coordinates[0];
    buildingRings.push(ring);
    buildingInfo.push({ ring, name });
  }
}

console.log(`Campus boundary loaded. ${buildingInfo.length} building obstacles.`);

// ===== Bounding box of campus =====

let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
for (const [lng, lat] of campusRing) {
  if (lng < minLng) minLng = lng;
  if (lng > maxLng) maxLng = lng;
  if (lat < minLat) minLat = lat;
  if (lat > maxLat) maxLat = lat;
}

// ===== Generate walkable grid nodes =====

const nodes = [];
const edges = [];
let nextId = 0;

// grid[col][row] = node id, or -1 if not walkable
const colCount = Math.ceil((maxLng - minLng) / D_LNG) + 2;
const rowCount = Math.ceil((maxLat - minLat) / D_LAT) + 2;
const grid = Array.from({ length: colCount }, () => new Int32Array(rowCount).fill(-1));

for (let ci = 0; ci < colCount; ci++) {
  const lng = minLng + ci * D_LNG;
  for (let ri = 0; ri < rowCount; ri++) {
    const lat = minLat + ri * D_LAT;
    if (!pip(lng, lat, campusRing)) continue;
    if (buildingRings.some((r) => pip(lng, lat, r))) continue;
    const id = nextId++;
    nodes.push({ id, lng, lat });
    grid[ci][ri] = id;
  }
}

console.log(`Grid nodes (walkable): ${nodes.length}`);

// ===== Connect grid nodes 8-directionally =====

const seen = new Set();

function tryEdge(idA, idB, a, b) {
  const key = idA < idB ? `${idA}-${idB}` : `${idB}-${idA}`;
  if (seen.has(key)) return;
  seen.add(key);
  if (crossesBuilding(a, b, buildingRings)) return;
  const w = haversineM(a, b);
  edges.push({ from: idA, to: idB, w });
  edges.push({ from: idB, to: idA, w });
}

const DIRS = [[1, 0], [0, 1], [1, 1], [1, -1]]; // positive-direction pairs only

for (let ci = 0; ci < colCount; ci++) {
  for (let ri = 0; ri < rowCount; ri++) {
    const idA = grid[ci][ri];
    if (idA < 0) continue;
    const a = nodes[idA];
    for (const [dc, dr] of DIRS) {
      const nc = ci + dc, nr = ri + dr;
      if (nc < 0 || nc >= colCount || nr < 0 || nr >= rowCount) continue;
      const idB = grid[nc][nr];
      if (idB < 0) continue;
      tryEdge(idA, idB, a, nodes[idB]);
    }
  }
}

console.log(`Grid edges: ${edges.length / 2} unique (${edges.length} directed)`);

// ===== Add building centroid nodes =====
// Each centroid gets an edge to its nearest walkable grid node.
// We intentionally skip the crossing check for these short "entry" edges
// because the centroid is inside the building by definition.

for (const { ring, name } of buildingInfo) {
  const c = centroid(ring);
  const cId = nextId++;
  nodes.push({ id: cId, lng: c.lng, lat: c.lat });

  // Find nearest existing node (grid or other centroid)
  let nearId = -1, nearDist = Infinity;
  for (let i = 0; i < nodes.length - 1; i++) {
    const d = haversineM(nodes[i], c);
    if (d < nearDist) { nearDist = d; nearId = nodes[i].id; }
  }

  if (nearId >= 0) {
    edges.push({ from: cId, to: nearId, w: nearDist });
    edges.push({ from: nearId, to: cId, w: nearDist });
  }
}

console.log(`Building centroids added: ${buildingInfo.length}`);

// ===== Output =====

const graph = {
  meta: {
    source: "buildings.geojson",
    gridSpacingApproxM: 8,
    generated: new Date().toISOString(),
  },
  nodes,
  edges,
};

fs.writeFileSync(OUTPUT, JSON.stringify(graph));
console.log(`\n✓ campusGraph.json written`);
console.log(`  nodes : ${nodes.length}`);
console.log(`  edges : ${edges.length} directed (${edges.length / 2} unique)`);
