// app/tools/scan-require.js
const fs = require("fs");
const path = require("path");

// 🔥 Scansioniamo SOLO la cartella /app
const ROOT = path.join(process.cwd(), "app");

// 🔥 File di output
const OUTPUT_FILE = path.join(process.cwd(), "require-scan.txt");
let output = "=== SCANSIONE REQUIRE RELATIVI (solo /app) ===\n\n";

function log(text) {
  console.log(text);
  output += text + "\n";
}

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanDir(full);
      continue;
    }

    if (entry.name.endsWith(".js") || entry.name.endsWith(".cjs")) {
      scanFile(full);
    }
  }
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    const match = line.match(/require\(['"`](\.{1,2}\/[^'"`]+)['"`]\)/);

    if (match) {
      const relative = match[1];
      const absolute = path.resolve(path.dirname(filePath), relative);
      const projectRelative = path.relative(process.cwd(), absolute);

      log("\n==============================");
      log("FILE: " + filePath.replace(process.cwd(), ""));
      log("LINE: " + (i + 1));
      log("RELATIVE REQUIRE: " + relative);
      log("REAL PATH: " + projectRelative);
      log("SUGGESTED FIX:");
      log(
        `  const X = require(path.join(process.cwd(), "${projectRelative.replace(/\\/g, "/")}"));`
      );
    }
  });
}

log("🔍 SCANSIONE REQUIRE RELATIVI (solo /app)…");
scanDir(ROOT);
log("\n✅ SCANSIONE COMPLETATA");

// 🔥 Scrivi tutto nel file
fs.writeFileSync(OUTPUT_FILE, output, "utf8");

// 🔥 Stampa tutto il file a schermo
console.log("\n\n📄 CONTENUTO DI require-scan.txt:\n");
console.log(output);
console.log("\n📄 File salvato in:", OUTPUT_FILE);
