// app/tools/scan-require-html.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(process.cwd(), "app");
const OUTPUT_FILE = path.join(process.cwd(), "app/public/require-report.html");

let rows = [];

/**
 * Scansiona ricorsivamente le cartelle
 */
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

/**
 * Scansiona un singolo file
 */
function scanFile(filePath) {
  const content = fs.readFileSync(filePath, "utf8");
  const lines = content.split("\n");

  lines.forEach((line, i) => {
    // Cerca require relativi tipo "./x", "../x"
    const match = line.match(/require\(['"`](\.{1,2}\/[^'"`]+)['"`]\)/);

    // Cerca import database.cjs
    const dbMatch = line.match(/require\(['"`].*database\.cjs['"`]\)/);

    // Se non c'è nulla, salta
    if (!match && !dbMatch) return;

    let critical = "OK";
    let relative = null;
    let real = null;
    let fix = null;

    // Caso 1: require relativo
    if (match) {
      relative = match[1];

      // ❌ Se già usa process.cwd(), ignora
      if (line.includes("process.cwd()")) return;

      // ❌ Se NON è relativo, ignora
      if (!relative.startsWith(".")) return;

      // Calcola percorso reale
      const absolute = path.resolve(path.dirname(filePath), relative);
      real = path.relative(process.cwd(), absolute).replace(/\\/g, "/");

      fix = `const X = require(path.join(process.cwd(), "${real}"));`;

      // 🔥 Criticità: se il file è in startup, services, middleware → pericoloso
      if (
        filePath.includes("/startup/") ||
        filePath.includes("/services/") ||
        filePath.includes("/middleware/")
      ) {
        critical = "🔥 PERICOLOSO (caricato prima del restore)";
      } else {
        critical = "⚠️ Relativo da patchare";
      }
    }

    // Caso 2: import database.cjs
    if (dbMatch) {
      critical = "💀 IMPORT DATABASE.CJS (potenziale DB vuoto)";
      relative = "database.cjs";
      real = "app/server/db/database.cjs";
      fix = `const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));`;
    }

    rows.push({
      file: filePath.replace(process.cwd(), ""),
      line: i + 1,
      relative,
      real,
      fix,
      critical
    });
  });
}

console.log("🔍 SCANSIONE REQUIRE RELATIVI + IMPORT DB...");
scanDir(ROOT);
console.log("✅ SCANSIONE COMPLETATA. Genero HTML…");

/**
 * Genera HTML
 */
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
    .crit-ok { color:#9ca3af; }
    .crit-warn { color:#fbbf24; }
    .crit-danger { color:#f87171; font-weight:bold; }
    .crit-dead { color:#ef4444; font-weight:bold; font-size:14px; }
  </style>
</head>
<body>
  <h1>Require relativi e import database.cjs</h1>
  <p>Totale: ${rows.length}</p>
  <table>
    <thead>
      <tr>
        <th>File</th>
        <th>Linea</th>
        <th>Relative</th>
        <th>Percorso reale</th>
        <th>Criticità</th>
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
          <td><code>${r.relative || ""}</code></td>
          <td><code>${r.real || ""}</code></td>
          <td class="${
            r.critical.includes("💀")
              ? "crit-dead"
              : r.critical.includes("🔥")
              ? "crit-danger"
              : r.critical.includes("⚠️")
              ? "crit-warn"
              : "crit-ok"
          }">${r.critical}</td>
          <td><code>${r.fix || ""}</code></td>
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
