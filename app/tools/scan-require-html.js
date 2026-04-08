// app/tools/scan-require-html.js
const fs = require("fs");
const path = require("path");

// Scansioniamo SOLO la cartella /app
const ROOT = path.join(process.cwd(), "app");

// File di output HTML
const OUTPUT_FILE = path.join(process.cwd(), "app/tools/require-report.html");

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
    body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; background:#0b0b10; color:#f5f5f5; }
    h1 { margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th, td { border: 1px solid #333; padding: 6px 8px; vertical-align: top; }
    th { background: #111827; position: sticky; top: 0; }
    tr:nth-child(even) { background: #111; }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace; }
    .file { color:#93c5fd; }
    .path { color:#a5b4fc; }
    .rel { color:#f97373; }
    .fix { color:#4ade80; white-space: pre; }
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
          <td class="file"><code>${r.file}</code></td>
          <td>${r.line}</td>
          <td class="rel"><code>${r.relative}</code></td>
          <td class="path"><code>${r.real}</code></td>
          <td class="fix"><code>${r.fix}</code></td>
        </tr>`
        )
        .join("")}
    </tbody>
  </table>
</body>
</html>`;

fs.writeFileSync(OUTPUT_FILE, html, "utf8");
console.log("📄 Report HTML salvato in:", OUTPUT_FILE);
