/* =========================================================
   INTROSPECT ENDPOINTS — Versione 2027.50 (compatibile router universale)
   Scanner unico: backend + frontend + differenze + HTML
========================================================= */

const fs = require("fs");
const path = require("path");

/* =========================================================
   1) SCANNER BACKEND (index.cjs → endpoint reali)
========================================================= */
function getBackend() {
  const indexPath = path.join(process.cwd(), "app/server/index.cjs");
  const index = require(indexPath);

  const out = [];

  for (const modulo of Object.keys(index)) {
    const funzioni = index[modulo];

    for (const fn of Object.keys(funzioni)) {
      out.push(`/api/${modulo.toLowerCase()}/${fn.toLowerCase()}`);
    }
  }

  return out;
}

/* =========================================================
   2) SCANNER FRONTEND (fetch → endpoint reali)
========================================================= */
function getFrontend() {
  const root = path.join(process.cwd(), "app/public");
  const calls = [];

  function normalize(url) {
    url = url.split("?")[0];
    url = url.replace(/\$\{[^}]+\}/g, "");
    url = url.replace(/\/+/g, "/");
    if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1);
    return url.toLowerCase();
  }

  function scanFile(filePath) {
    const code = fs.readFileSync(filePath, "utf8");
    const regex = /fetch\s*\(\s*["'`](.*?)["'`]/g;

    let m;
    while ((m = regex.exec(code))) {
      let url = m[1];
      if (url.startsWith("/api/")) {
        calls.push(normalize(url));
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

  return [...new Set(calls)];
}

/* =========================================================
   3) DIFFERENZE (match reale, no parametri finti)
========================================================= */
function getDifferenze() {
  const backend = getBackend();
  const frontend = getFrontend();

  const ok = frontend.filter(f => backend.includes(f));
  const mancanti = frontend.filter(f => !backend.includes(f));
  const inutilizzati = backend.filter(b => !frontend.includes(b));

  return {
    ok: [...new Set(ok)],
    mancanti: [...new Set(mancanti)],
    inutilizzati: [...new Set(inutilizzati)]
  };
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
      ${table("MANCANTI (frontend → backend)", diff.mancanti, "red")}
      ${table("INUTILIZZATI (backend → frontend)", diff.inutilizzati, "orange")}

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
