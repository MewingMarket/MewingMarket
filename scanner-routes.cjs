/**
 * =========================================================
 * Scanner Routes — trova file che montano /api o route sospette
 * Versione 2026.300 — Simone Debug Mode
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("app/server");
console.log("🟦 SCANNER ROUTES — ROOT:", ROOT);

const patterns = [
  'router.use("/api',
  "router.use('/api",
  'app.use("/api',
  "app.use('/api",
  "module.exports = (app)",
  'router.use("/prodotti',
  'router.use("/ordini',
  'router.use("/download',
  'router.use("/vendite',
  'router.use("/feedback'
];

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const hits = patterns.filter(p => content.includes(p));
  if (hits.length > 0) {
    console.log("\n🔍 FILE SOSPETTO:", filePath);
    hits.forEach(h => console.log("   → MATCH:", h));
  }
}

function scanDir(dir) {
  const items = fs.readdirSync(dir);
  for (const item of items) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      scanDir(full);
    } else if (full.endsWith(".cjs") || full.endsWith(".js")) {
      scanFile(full);
    }
  }
}

scanDir(ROOT);

console.log("\n🟩 SCANSIONE COMPLETATA");
