/**
 * =========================================================
 * File: app/server/scripts/scanner-context.cjs
 * SCOPO: Scansiona TUTTO il progetto e trova QUALSIASI require
 *        che punti a context.cjs (anche se relativo, sbagliato,
 *        annidato o in un file dimenticato).
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

console.log("🔍 SCANNER CONTEXT.CJS AVVIATO");
console.log("📂 ROOT:", ROOT);
console.log("========================================");

function scan(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scan(full);
      continue;
    }

    if (!entry.name.endsWith(".cjs") && !entry.name.endsWith(".js")) continue;

    const content = fs.readFileSync(full, "utf8");

    if (content.includes("context.cjs")) {
      console.log("\n----------------------------------------");
      console.log("📌 MATCH TROVATO IN:", full);
      console.log("----------------------------------------");

      const lines = content.split("\n");
      lines.forEach((line, i) => {
        if (line.includes("context.cjs")) {
          console.log(`${i + 1}: ${line}`);
        }
      });
    }
  }
}

scan(ROOT);

console.log("========================================");
console.log("✅ SCANNER COMPLETATO");
