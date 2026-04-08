// app/tools/scan-require.js
const fs = require("fs");
const path = require("path");

// 🔥 Scansioniamo SOLO la cartella /app
const ROOT = path.join(process.cwd(), "app");

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

      console.log("\n====================================");
      console.log("FILE:", filePath.replace(process.cwd(), ""));
      console.log("LINE:", i + 1);
      console.log("RELATIVE REQUIRE:", relative);
      console.log("REAL PATH:", projectRelative);
      console.log("SUGGESTED FIX:");
      console.log(
        `  const X = require(path.join(process.cwd(), "${projectRelative.replace(/\\/g, "/")}"));`
      );
    }
  });
}

console.log("🔍 SCANSIONE REQUIRE RELATIVI (solo /app)…");
scanDir(ROOT);
console.log("\n✅ SCANSIONE COMPLETATA");
