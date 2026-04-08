// app/tools/scan-require-html.js
const fs = require("fs");
const path = require("path");

// Scansioniamo SOLO la cartella /app
const ROOT = path.join(process.cwd(), "app");

// 🔥 Salviamo il report in /app/public così è accessibile via browser
const OUTPUT_FILE = path.join(process.cwd(), "app/public/require-report.html");

let rows = [];

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

      rows.push({
        file: filePath.replace(process.cwd(), ""),
        line: i + 1,
        relative,
        real: projectRelative.replace(/\\/g, "/"),
        fix: `const X = require(path.join(process.cwd(), "${projectRelative.replace(/\\/g, "/")}"));`
      });
    }
  });
}

console.log("🔍 SCANSIONE REQUIRE RELATIVI (solo /app)...");
scanDir(ROOT);
console.log("✅ SCANSIONE COMPLETATA. Genero HTML…");

const html = `<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8" />
  <title>Require Scan Report</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 20px; background:#0b0b10; color:#f5f5f5; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #333; padding: 6px 8px; }
    th { background: #111827; }
    tr:nth-child(even) { background: #111; }
    code { font-family: monospace; }
  </style>
</head>
<body>
  <h1>Require relativi in /app</h1>
  <p>Totale: ${rows.length}</p>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Linea</th>
        <th>Relative</th>
        <th>Percorso reale</th>
        <th>Fix suggerito</th>
      </tr>
    </thead>
    <tbody>
      ${rows
        .map(
          r => `
        <tr>
          <td><code>${r.file}</code></td>
          <td>${r.line}</td>
          <td><code>${r.relative}</code></td>
          <td><code>${r.real}</code></td>
          <td><code>${r.fix}</code></td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html, "utf8");

console.log("📄 Report HTML salvato in:", OUTPUT_FILE);
console.log("🌐 Aprilo da browser:");
console.log("   /require-report.html");
