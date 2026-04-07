/**
 * Scanner per trovare TUTTI i require di context.cjs
 * Utile per scoprire se c’è un altro file che fa require sbagliati
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.cwd();

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

console.log("🔍 Avvio scanner context.cjs…");
scan(ROOT);
console.log("✅ Scanner completato");
