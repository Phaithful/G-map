// Merges all per-building GeoJSON files into a single FeatureCollection
// with height properties for 3D fill-extrusion rendering.
// Run: node scripts/mergeBuildings.js

const fs = require("fs");
const path = require("path");

const inputDir = path.join(__dirname, "../public/buildings.geojson");
const outputFile = path.join(__dirname, "../public/buildings-merged.geojson");

// Assign approximate heights (metres) by building name keyword
function guessHeight(filename) {
  const n = filename.toLowerCase();
  if (n.includes("hall") || n.includes("convo") || n.includes("goodluck hall")) return 16;
  if (n.includes("admin") || n.includes("vc") || n.includes("dvc")) return 14;
  if (n.includes("arc") || n.includes("cob") || n.includes("edu") || n.includes("main campus")) return 12;
  if (n.includes("lab") || n.includes("sam") || n.includes("cohon")) return 11;
  if (n.includes("clinic") || n.includes("health") || n.includes("radio")) return 9;
  if (n.includes("bursar") || n.includes("old nifes") || n.includes("ubc")) return 10;
  if (n.includes("security") || n.includes("toilet") || n.includes("storage")) return 4;
  if (n.includes("free area") || n.includes("register")) return 3;
  return 8;
}

// Exclude campus-boundary outlines — these are area shapes, not individual buildings
const EXCLUDED = ["main campus 1.geojson", "free area.geojson", "registerline.geojson"];

const files = fs
  .readdirSync(inputDir)
  .filter((f) => f.endsWith(".geojson") && !EXCLUDED.includes(f));
const allFeatures = [];

for (const file of files) {
  const content = JSON.parse(fs.readFileSync(path.join(inputDir, file), "utf8"));
  const height = guessHeight(file);
  const name = file.replace(".geojson", "");

  for (const feature of content.features || []) {
    allFeatures.push({
      ...feature,
      properties: { ...feature.properties, height, base_height: 0, name },
    });
  }
}

fs.writeFileSync(
  outputFile,
  JSON.stringify({ type: "FeatureCollection", features: allFeatures }),
);

console.log(`Merged ${allFeatures.length} features from ${files.length} files → buildings-merged.geojson`);
