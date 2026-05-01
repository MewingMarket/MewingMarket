/**
 * =========================================================
 * Middleware Diagnostico — Versione 2027.60
 * Compatibile con router universale + universal-json
 * Stampa SOLO endpoint reali da index.cjs
 * =========================================================
 */

const path = require("path");

module.exports = function diagnosticoRoutes(app) {
  console.log("🟦 [DIAGNOSTICA] ROUTE SCANNER ATTIVATO (2027.60)");

  const indexFunzioni = require(path.join(process.cwd(), "app/server/index.cjs"));

  console.log("🟦 [DIAGNOSTICA] SCANSIONE ENDPOINT REALI…");

  for (const modulo of Object.keys(indexFunzioni)) {
    const funzioni = indexFunzioni[modulo];

    for (const fn of Object.keys(funzioni)) {
      const endpoint = `/api/${modulo}/${fn}`;
      console.log(`🔹 ROUTE: GET/POST ${endpoint}`);
    }
  }

  console.log("🟩 [DIAGNOSTICA] SCANSIONE COMPLETATA");
};
