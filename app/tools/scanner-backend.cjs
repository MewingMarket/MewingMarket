/* =========================================================
   SCANNER BACKEND — Versione 2058
   Percorso: /app/tools/scanner-backend.cjs
   Scansiona TUTTI i moduli in /routes/
   - Funzioni dichiarate
   - Funzioni esportate
   - Funzioni mancanti
   - Moduli vuoti
   - Alias mancanti
   Output: /app/public/scan-backend.html
========================================================= */

const fs = require("fs");
const path = require("path");

const ROUTES_DIR = path.join(process.cwd(), "app/server/routes");
const OUTPUT = path.join(process.cwd(), "app/public/scan-backend.html");

function estraiFunzioniDichiarate(contenuto) {
  const regex = /async function ([a-zA-Z0-9_]+)/g;
  const out = [];
  let m;
  while ((m = regex.exec(contenuto))) {
    out.push(m[1]);
  }
  return out;
}

function estraiExport(contenuto) {
  const match = contenuto.match(/module\.exports\s*=\s*{([\s\S]*?)}/);
  if (!match) return [];

  const body = match[1];
  return body
    .split(",")
    .map(x => x.trim().replace(/[\n\r]/g, ""))
    .filter(x => x.length > 0);
}

function scanFile(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");

  const dichiarate = estraiFunzioniDichiarate(raw);
  const esportate = estraiExport(raw);

  const mancanti = dichiarate.filter(fn => !esportate.includes(fn));
  const ghost = esportate.filter(fn => !dichiarate.includes(fn));

  return { dichiarate, esportate, mancanti, ghost };
}

function generaHTML(report) {
  let html = `
  <html>
  <head>
    <title>SCAN BACKEND 2058</title>
    <style>
      body { font-family: Arial; padding:20px; }
      h2 { margin-top:40px; }
      .ok { color:green; }
      .warn { color:orange; }
      .err { color:red; }
      pre { background:#f0f0f0; padding:10px; }
    </style>
  </head>
  <body>
    <h1>SCAN BACKEND 2058</h1>
    <p>Analisi moduli in <b>/app/server/routes/</b></p>
  `;

  for (const r of report) {
    html += `<h2>${r.file}</h2>`;

    if (r.esportate.length === 0) {
      html += `<p class="err">❌ Nessuna export trovata</p>`;
    }

    if (r.mancanti.length === 0 && r.ghost.length === 0) {
      html += `<p class="ok">🟩 Modulo OK — tutte le funzioni esportate correttamente</p>`;
    }

    if (r.mancanti.length > 0) {
      html += `<p class="err">🟥 Funzioni dichiarate MA NON esportate:</p><pre>${r.mancanti.join("\n")}</pre>`;
    }

    if (r.ghost.length > 0) {
      html += `<p class="warn">🟧 Funzioni esportate MA NON dichiarate:</p><pre>${r.ghost.join("\n")}</pre>`;
    }

    html += `
      <h3>Funzioni dichiarate</h3>
      <pre>${r.dichiarate.join("\n")}</pre>

      <h3>Funzioni esportate</h3>
      <pre>${r.esportate.join("\n")}</pre>
    `;
  }

  html += `</body></html>`;
  return html;
}

function main() {
  const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".cjs"));

  const report = files.map(f => {
    const full = path.join(ROUTES_DIR, f);
    const scan = scanFile(full);
    return { file: f, ...scan };
  });

  const html = generaHTML(report);
  fs.writeFileSync(OUTPUT, html, "utf8");

  console.log("🟩 SCAN BACKEND COMPLETATO");
  console.log("📄 Report generato in:", OUTPUT);
}

main();
