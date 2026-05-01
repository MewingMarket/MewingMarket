/* =========================================================
   /api/generico — Versione 2027.900
   Restituisce l’ultimo JSON universale salvato
========================================================= */

const fs = require("fs");
const path = require("path");

function getGenerico(req) {
  const filePath = path.join(process.cwd(), "app/server/db/generico.json");

  try {
    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (e) {
    return {
      success: false,
      error: "Nessun dato disponibile",
      timestamp: Date.now()
    };
  }
}

module.exports = {
  getGenerico
};
