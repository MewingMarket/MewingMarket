// ============================================================
// SCANNER JAVA-MODE — BACKEND + FRONTEND + MATCHER + REPORT HTML
// Percorso: /app/tools/scanner.js
// Esegui con: node scanner.js
// ============================================================

const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const SERVER_INDEX = path.join(process.cwd(), "app/server/index.cjs");
const PUBLIC_DIR   = path.join(process.cwd(), "app/public");
const OUT_HTML     = path.join(process.cwd(), "app/public/scan-report.html");

// ------------------------------------------------------------
// 1) SCAN BACKEND (JAVA-MODE, usando app/server/index.cjs)
// ------------------------------------------------------------
function scanBackendJavaMode() {
  const modules = require(SERVER_INDEX); // { prodotti: {...}, admin: {...}, ... }

  const endpoints = {}; // "GET /api/prodotti/getProdotti" → "prodotti"

  for (const [groupName, groupExports] of Object.entries(modules)) {
    if (!groupExports || typeof groupExports !== "object") continue;

    for (const fnName of Object.keys(groupExports)) {
      // Saltiamo cose non funzione (se mai ci fossero)
      const value = groupExports[fnName];
      if (typeof value !== "function") continue;

      // In Java-mode non hai ancora il metodo (GET/POST),
      // quindi per ora lo marchiamo come "ANY"
      const method = "ANY";
      const route  = `/api/${groupName}/${fnName}`;

      endpoints[`${method} ${route}`] = groupName;
    }
  }

  return endpoints;
}

// ------------------------------------------------------------
// 2) SCAN FRONTEND (fetch, axios, XHR, ecc.)
// ------------------------------------------------------------
function readAllFiles(dir, ext = ".js") {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(readAllFiles(full, ext));
    } else if (file.endsWith(ext)) {
      results.push(full);
    }
  }

  return results;
}

function scanFrontend() {
  const files = readAllFiles(PUBLIC_DIR, ".js");
  const endpoints = new Set();

  const regex = /\/api\/[a-zA-Z0-9\-\/]+/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    const matches = content.match(regex);
    if (matches) matches.forEach(e => endpoints.add(e));
  }

  return [...endpoints];
}

// ------------------------------------------------------------
// 3) MATCHER BACKEND ↔ FRONTEND
// ------------------------------------------------------------
function compareEndpoints(backend, frontend) {
  const backendList  = Object.keys(backend);          // ["ANY /api/prodotti/getProdotti", ...]
  const backendPaths = backendList.map(e => e.split(" ")[1]); // ["/api/prodotti/getProdotti", ...]

  const ok      = frontend.filter(e => backendPaths.includes(e));
  const missing = frontend.filter(e => !backendPaths.includes(e));
  const unused  = backendPaths.filter(e => !frontend.includes(e));

  const wrong = missing.filter(e =>
    backendPaths.some(b => b.split("/")[2] === e.split("/")[2])
  );

  return { ok, missing, unused, wrong };
}

// ------------------------------------------------------------
// 4) GENERA REPORT HTML
// ------------------------------------------------------------
function generateHTML(backend, frontend, report) {
  const html = `
<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<title>Scan Report — Backend ↔ Frontend (Java-mode)</title>
<style>
body { font-family: Arial; padding: 20px; background: #f5f5f5; }
h1 { color: #333; }
section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
pre { background: #222; color: #0f0; padding: 10px; border-radius: 6px; overflow-x: auto; }
.ok { color: green; }
.missing { color: red; }
.unused { color: orange; }
.wrong { color: #c60; }
</style>
</head>
<body>

<h1>🔍 Scan Report — Backend ↔ Frontend (Java-mode)</h1>

<section>
<h2 class="ok">🟩 Endpoint OK</h2>
<pre>${JSON.stringify(report.ok, null, 2)}</pre>
</section>

<section>
<h2 class="missing">🟥 Endpoint Mancanti (Frontend → Backend)</h2>
<pre>${JSON.stringify(report.missing, null, 2)}</pre>
</section>

<section>
<h2 class="unused">🟨 Endpoint Inutilizzati (Backend → Frontend)</h2>
<pre>${JSON.stringify(report.unused, null, 2)}</pre>
</section>

<section>
<h2 class="wrong">🟧 Endpoint Simili (probabile errore)</h2>
<pre>${JSON.stringify(report.wrong, null, 2)}</pre>
</section>

<section>
<h2>🟦 Backend Completo (Java-mode)</h2>
<pre>${JSON.stringify(backend, null, 2)}</pre>
</section>

<section>
<h2>🟦 Frontend Completo</h2>
<pre>${JSON.stringify(frontend, null, 2)}</pre>
</section>

</body>
</html>
`;

  fs.writeFileSync(OUT_HTML, html);
  console.log("🟩 Report HTML generato in:", OUT_HTML);
}

// ------------------------------------------------------------
// 5) RUN
// ------------------------------------------------------------
console.log("🔍 SCAN BACKEND (Java-mode)...");
const backend = scanBackendJavaMode();

console.log("🔍 SCAN FRONTEND...");
const frontend = scanFrontend();

console.log("🔍 MATCH...");
const report = compareEndpoints(backend, frontend);

console.log("📝 GENERO REPORT HTML...");
generateHTML(backend, frontend, report);

console.log("🟩 SCAN COMPLETATO");
