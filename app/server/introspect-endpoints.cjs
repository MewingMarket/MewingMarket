/* =========================================================
   INTROSPECT ENDPOINTS — Versione 2027.1
   Scanner unico: backend + frontend + differenze + HTML
========================================================= */

const fs = require("fs");
const path = require("path");

/* =========================================================
   1) SCANNER BACKEND
========================================================= */
function getBackend() {
  const indexPath = path.join(process.cwd(), "app/server/index.cjs");
  const index = require(indexPath);

  const out = {};

  for (const modulo of Object.keys(index)) {
    const funzioni = index[modulo];
    out[modulo] = Object.keys(funzioni);
  }

  return out;
}

/* =========================================================
   2) SCANNER FRONTEND
========================================================= */
function getFrontend() {
  const root = path.join(process.cwd(), "app/public");

  const calls = [];

  function scanFile(filePath) {
    const code = fs.readFileSync(filePath, "utf8");

    const regex = /fetch\s*\(\s*["'`](.*?)["'`]/g;
    let m;
    while ((m = regex.exec(code))) {
      const url = m[1];
      if (url.startsWith("/api/")) {
        calls.push(url.split("?")[0]);
      }
    }
  }

  function walk(dir) {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const full = path.join(dir, item);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) walk(full);
      else if (item.endsWith(".js")) scanFile(full);
    }
  }

  walk(root);

  return { frontendCalls: [...new Set(calls)] };
}

/* =========================================================
   3) DIFFERENZE
========================================================= */
function getDifferenze() {
  const backend = getBackend();
  const frontend = getFrontend().frontendCalls;

  const backendFull = [];

  for (const modulo of Object.keys(backend)) {
    for (const fn of backend[modulo]) {
      backendFull.push(`/api/${modulo}/${fn}`);
    }
  }

  const ok = frontend.filter(f => backendFull.includes(f));
  const mancanti = frontend.filter(f => !backendFull.includes(f));
  const inutilizzati = backendFull.filter(b => !frontend.includes(b));

  return { ok, mancanti, inutilizzati };
}

/* =========================================================
   4) HTML DIAGNOSTICO
========================================================= */
function diagnosticaHtmlToString() {
  const diff = getDifferenze();

  function table(title, arr, color) {
    return `
      <h2 style="color:${color}">${title} (${arr.length})</h2>
      <table border="1" cellpadding="6" style="border-collapse:collapse;width:100%">
        ${arr.map(x => `<tr><td>${x}</td></tr>`).join("")}
      </table>
    `;
  }

  return `
    <html>
    <head>
      <title>Diagnostica Endpoint</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        h1 { color: #333; }
      </style>
    </head>
    <body>
      <h1>Diagnostica Endpoint — MewingMarket</h1>

      ${table("OK", diff.ok, "green")}
      ${table("MANCANTI", diff.mancanti, "red")}
      ${table("INUTILIZZATI", diff.inutilizzati, "orange")}

    </body>
    </html>
  `;
}

module.exports = {
  getBackend,
  getFrontend,
  getDifferenze,
  diagnosticaHtmlToString
};
