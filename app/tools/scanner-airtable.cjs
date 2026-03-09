/**
 * =========================================================
 * SCANNER AIRTABLE — trova ogni riferimento a airtable.cjs
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("app");
const TARGET = "airtable.cjs";

console.log("🔍 Scanner Airtable avviato…");
console.log("📁 Root:", ROOT);
console.log("🎯 Target:", TARGET);
console.log("====================================\n");

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(fullPath);
      continue;
    }

    if (!entry.name.endsWith(".js") && !entry.name.endsWith(".cjs")) continue;

    const content = fs.readFileSync(fullPath, "utf8");

    if (content.includes(TARGET)) {
      console.log("📌 FILE:", fullPath);

      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (line.includes(TARGET)) {
          console.log(`   ➜ riga ${i + 1}:`, line.trim());
        }
      });

      console.log("------------------------------------\n");
    }
  }
}

scanDir(ROOT);

console.log("\n====================================");
console.log("✅ SCAN COMPLETATO");
console.log("====================================\n");
