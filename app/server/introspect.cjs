/* FILE: app/server/introspect.cjs
   PERCORSO: /app/server/introspect.cjs
   RUOLO: CJS → legge backend, confronta, restituisce match
*/

const fs = require("fs");
const path = require("path");

module.exports = function (app) {

  const PUBLIC_DIR = path.join(__dirname, "../public");

  // ============================================================
  // 1) Trova endpoint API esistenti nel router
  // ============================================================
  function getApiEndpoints() {
    const router = app._router.stack;
    const endpoints = [];

    router.forEach(layer => {
      if (layer.route && layer.route.path) {
        const base = layer.route.path;
        const methods = Object.keys(layer.route.methods);
        methods.forEach(m => {
          endpoints.push("/api" + base);
        });
      }
    });

    return endpoints;
  }

  // ============================================================
  // 2) Verifica se un file statico esiste
  // ============================================================
  function fileExists(relPath) {
    const p = path.join(PUBLIC_DIR, relPath.replace(/^\//, ""));
    return fs.existsSync(p);
  }

  // ============================================================
  // 3) Endpoint principale
  // ============================================================
  app.post("/introspect/match", (req, res) => {
    const { api = [], html = [], js = [], json = [] } = req.body;

    const endpoints = getApiEndpoints();

    const match = {
      api: api.filter(a => endpoints.includes(a)),
      html: html.filter(h => fileExists(h)),
      js: js.filter(j => fileExists(j)),
      json: json.filter(j => fileExists(j))
    };

    res.json(match);
  });

};
