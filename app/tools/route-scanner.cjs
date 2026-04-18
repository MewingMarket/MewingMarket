/**
 * =========================================================
 * ROUTE SCANNER UNIVERSALE — Versione 2027.2
 * Legge:
 *  - Frontend (fetch, axios, URL)
 *  - Backend (router, app.get, router.use)
 *  - Testa le route con timeout
 *  - Genera report HTML
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch");

const FRONTEND_DIR = path.join(process.cwd(), "app/public");
const ROUTES_DIR = path.join(process.cwd(), "app/server/routes");
const OUTPUT = path.join(process.cwd(), "app/public/diagnostica-routes.html");

function scanFrontend() {
  const files = fs.readdirSync(FRONTEND_DIR).filter(f => f.endsWith(".js"));
  const routes = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(FRONTEND_DIR, file), "utf8");

    // fetch("/api/xxx")
    const regex = /fetch\(["'`](\/api\/[^"'`]+)/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      routes.add(m[1]);
    }

    // axios.get("/api/xxx")
    const regex2 = /axios\.(get|post|put|delete)\(["'`](\/api\/[^"'`]+)/g;
    while ((m = regex2.exec(content)) !== null) {
      routes.add(m[2]);
    }
  }

  return [...routes];
}

function scanBackend() {
  const files = fs.readdirSync(ROUTES_DIR).filter(f => f.endsWith(".cjs"));
  const routes = new Set();

  for (const file of files) {
    const content = fs.readFileSync(path.join(ROUTES_DIR, file), "utf8");

    // app.get("/api/xxx")
    const regex = /app\.(get|post|use)\(["'`](\/api\/[^"'`]+)/g;
    let m;
    while ((m = regex.exec(content)) !== null) {
      routes.add(m[2]);
    }

    // router.get("/xxx")
    const regex2 = /router\.(get|post|use)\(["'`](\/[^"'`]+)/g;
    while ((m = regex2.exec(content)) !== null) {
      routes.add("/api" + m[2]);
    }
  }

  return [...routes];
}

async function testRoutes(routes) {
  const results = [];

  const timeout = (ms) =>
    new Promise((_, reject) => setTimeout(() => reject(new Error("TIMEOUT")), ms));

  for (const r of routes) {
    try {
      const res = await Promise.race([
        fetch("https://www.mewingmarket.it" + r),
        timeout(3000)
      ]);

      const text = await res.text();

      results.push({
        route: r,
        status: res.status,
        preview: text.slice(0, 120)
      });

    } catch (err) {
      results.push({
        route: r,
        status: "TIMEOUT",
        preview: err.message
      });
    }
  }

  return results;
}

function generateHTML(frontend, backend, matches, missing, tests) {
  const html = `
  <html>
  <head>
    <title>Diagnostica Routes</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h2 { margin-top: 40px; }
      table { border-collapse: collapse; width: 100%; margin-top: 10px; }
      td, th { border: 1px solid #ccc; padding: 8px; }
      tr:nth-child(even) { background: #f9f9f9; }
      .ok { color: green; }
      .err { color: red; }
    </style>
  </head>
  <body>
    <h1>Diagnostica Routes — Report</h1>

    <h2>1) Route chiamate dal frontend</h2>
    <pre>${frontend.join("\n")}</pre>

    <h2>2) Route esistenti nel backend</h2>
    <pre>${backend.join("\n")}</pre>

    <h2>3) Route che combaciano</h2>
    <pre>${matches.join("\n")}</pre>

    <h2>4) Route mancanti</h2>
    <pre>${missing.join("\n")}</pre>

    <h2>5) Test delle route</h2>
    <table>
      <tr><th>Route</th><th>Status</th><th>Preview</th></tr>
      ${tests.map(t => `
        <tr>
          <td>${t.route}</td>
          <td class="${t.status == 200 ? "ok" : "err"}">${t.status}</td>
          <td>${t.preview}</td>
        </tr>
      `).join("")}
    </table>
  </body>
  </html>
  `;

  fs.writeFileSync(OUTPUT, html);
  console.log("🟩 Report generato:", OUTPUT);
}

(async () => {
  console.log("🔍 Scansione frontend…");
  const frontendRoutes = scanFrontend();

  console.log("🔍 Scansione backend…");
  const backendRoutes = scanBackend();

  const matches = frontendRoutes.filter(r => backendRoutes.includes(r));
  const missing = frontendRoutes.filter(r => !backendRoutes.includes(r));

  console.log("🔍 Test delle route…");
  const tests = await testRoutes(frontendRoutes);

  console.log("📝 Generazione HTML…");
  generateHTML(frontendRoutes, backendRoutes, matches, missing, tests);
})();
