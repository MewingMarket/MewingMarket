// ============================================================
// SCANNER UNIVERSALE — FULL DISCOVERY (API + NON API + JAVA)
// Modalità: SMART MATCHING (B) + MIGRATION MODE (C)
// Output: SOLO HTML
// Percorso: /app/tools/scanner.js
// Esegui: node scanner.js
// ============================================================

const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// CONFIG
// ------------------------------------------------------------
const BACKEND_DIR = path.join(process.cwd(), "app/server");
const FRONTEND_DIR = path.join(process.cwd(), "app/public");
const OUT_HTML = path.join(process.cwd(), "app/public/scan-report.html");

// ------------------------------------------------------------
// UTILS
// ------------------------------------------------------------
function readAllFiles(dir, exts = [".js", ".cjs"]) {
  let results = [];
  const list = fs.readdirSync(dir);

  for (const file of list) {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(readAllFiles(full, exts));
    } else if (exts.some(ext => file.endsWith(ext))) {
      results.push(full);
    }
  }

  return results;
}

// ------------------------------------------------------------
// 1) SCAN BACKEND — EXPRESS + FASTIFY + JAVA-MODE
// ------------------------------------------------------------
function scanBackend() {
  const files = readAllFiles(BACKEND_DIR, [".js", ".cjs"]);
  const endpoints = new Set();

  const regexExpress = /(app|router)\.(get|post|put|delete)\s*\(\s*["'`](\/[^"'`]+)["'`]/g;
  const regexFastify = /fastify\.(get|post|put|delete)\s*\(\s*["'`](\/[^"'`]+)["'`]/g;
  const regexJavaMode = /module\.exports\s*=\s*\{([\s\S]*?)\}/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");

    // EXPRESS
    let match;
    while ((match = regexExpress.exec(content)) !== null) {
      endpoints.add(`${match[2].toUpperCase()} ${match[3]}`);
    }

    // FASTIFY
    while ((match = regexFastify.exec(content)) !== null) {
      endpoints.add(`${match[1].toUpperCase()} ${match[2]}`);
    }

    // JAVA-MODE (module.exports = { fn() {} })
    let javaBlock;
    while ((javaBlock = regexJavaMode.exec(content)) !== null) {
      const inner = javaBlock[1];
      const fnRegex = /([a-zA-Z0-9_]+)\s*\(/g;
      let fn;

      const fileName = path.basename(file).replace(/\.(cjs|js)$/, "");
      while ((fn = fnRegex.exec(inner)) !== null) {
        endpoints.add(`ANY /api/${fileName}/${fn[1]}`);
      }
    }
  }

  return [...endpoints];
}

// ------------------------------------------------------------
// 2) SCAN FRONTEND — SOLO .JS
// ------------------------------------------------------------
function scanFrontend() {
  const files = readAllFiles(FRONTEND_DIR, [".js"]);
  const endpoints = new Set();

  const regex = /["'`](\/[a-zA-Z0-9_\-\/\.]+)["'`]/g;

  for (const file of files) {
    const content = fs.readFileSync(file, "utf8");
    let match;

    while ((match = regex.exec(content)) !== null) {
      const url = match[1];

      // Consideriamo solo endpoint che iniziano con "/"
      if (url.startsWith("/")) {
        endpoints.add(url);
      }
    }
  }

  return [...endpoints];
}

// ------------------------------------------------------------
// 3) SMART MATCHING + MIGRATION MODE
// ------------------------------------------------------------
function compareEndpoints(backend, frontend) {
  const backendPaths = backend.map(e => e.split(" ")[1]);
  const ok = [];
  const alias = [];
  const similar = [];
  const missing = [];
  const unused = backendPaths.filter(b => !frontend.includes(b));

  for (const fe of frontend) {
    if (backendPaths.includes(fe)) {
      ok.push(fe);
      continue;
    }

    // SMART MATCHING (alias)
    const feParts = fe.split("/").filter(Boolean);
    const feGroup = feParts[1];

    const candidates = backendPaths.filter(b => b.includes(`/${feGroup}/`));

    if (candidates.length > 0) {
      similar.push({ frontend: fe, backend: candidates });
    } else {
      missing.push(fe);
    }
  }

  return { ok, alias, similar, missing, unused };
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
<title>Scan Report — Backend ↔ Frontend (FULL DISCOVERY)</title>
<style>
body { font-family: Arial; padding: 20px; background: #f5f5f5; }
h1 { color: #333; }
section { background: white; padding: 20px; margin-bottom: 20px; border-radius: 8px; }
pre { background: #222; color: #0f0; padding: 10px; border-radius: 6px; overflow-x: auto; }
.ok { color: green; }
.missing { color: red; }
.unused { color: orange; }
.similar { color: #c60; }
</style>
</head>
<body>

<h1>🔍 Scan Report — Backend ↔ Frontend (FULL DISCOVERY)</h1>

<section>
<h2 class="ok">🟩 Endpoint OK</h2>
<pre>${JSON.stringify(report.ok, null, 2)}</pre>
</section>

<section>
<h2 class="similar">🟧 Endpoint Simili (SMART MATCH)</h2>
<pre>${JSON.stringify(report.similar, null, 2)}</pre>
</section>

<section>
<h2 class="missing">🟥 Endpoint Mancanti (da creare)</h2>
<pre>${JSON.stringify(report.missing, null, 2)}</pre>
</section>

<section>
<h2 class="unused">🟨 Endpoint Inutilizzati (da rimuovere)</h2>
<pre>${JSON.stringify(report.unused, null, 2)}</pre>
</section>

<section>
<h2>🟦 Backend Completo (FULL DISCOVERY)</h2>
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
console.log("🔍 SCAN BACKEND (FULL DISCOVERY)...");
const backend = scanBackend();

console.log("🔍 SCAN FRONTEND (.js only)...");
const frontend = scanFrontend();

console.log("🔍 MATCH...");
const report = compareEndpoints(backend, frontend);

console.log("📝 GENERO REPORT HTML...");
generateHTML(backend, frontend, report);

console.log("🟩 SCAN COMPLETATO");
