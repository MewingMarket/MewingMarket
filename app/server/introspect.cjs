/* =========================================================
   INTROSPECT — Versione 2027.40 (compatibile router universale)
   - Legge index.cjs
   - Genera endpoint reali /api/<modulo>/<funzione>
   - Confronta con frontend
========================================================= */

const fs = require("fs");
const path = require("path");

module.exports = function (app) {

  const PUBLIC_DIR = path.join(__dirname, "../public");
  const indexFunzioni = require("./index.cjs");

  /* ============================================================
     1) Genera endpoint API reali da index.cjs
  ============================================================ */
  function getApiEndpoints() {
    const endpoints = [];

    for (const modulo of Object.keys(indexFunzioni)) {
      const funzioni = indexFunzioni[modulo];

      for (const nomeFunzione of Object.keys(funzioni)) {
        endpoints.push(`/api/${modulo}/${nomeFunzione.toLowerCase()}`);
      }
    }

    return endpoints;
  }

  /* ============================================================
     2) Verifica se un file statico esiste
  ============================================================ */
  function fileExists(relPath) {
    const p = path.join(PUBLIC_DIR, relPath.replace(/^\//, ""));
    return fs.existsSync(p);
  }

  /* ============================================================
     3) Endpoint principale
  ============================================================ */
  app.post("/introspect/match", (req, res) => {
    const { api = [], html = [], js = [], json = [] } = req.body;

    const endpoints = getApiEndpoints();

    const match = {
      api: api.filter(a => endpoints.includes(a.toLowerCase())),
      html: html.filter(h => fileExists(h)),
      js: js.filter(j => fileExists(j)),
      json: json.filter(j => fileExists(j)),
      _diagnostica: "introspect-ok"
    };

    res.json(match);
  });

};
