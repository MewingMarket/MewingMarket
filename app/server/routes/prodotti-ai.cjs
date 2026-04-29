/* =========================================================
   FILE: app/server/routes/prodotti-ai.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Generazione descrizioni prodotto (lunga + breve)
========================================================= */

const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const {
  generaDescrizioneLunga,
  generaDescrizioneBreve
} = R("modules/catalogo-ai.cjs");

/* ============================================================
   FUNZIONE PRINCIPALE — generaDescrizioneAI
============================================================ */
async function generaDescrizioneAI(req) {
  console.log("[DEBUG prodotti-ai] generaDescrizioneAI()");

  try {
    const { titolo, contenuto } = req.body || {};

    if (!titolo) {
      return {
        success: false,
        error: "Titolo mancante"
      };
    }

    const prodotto = {
      titolo,
      contenuto: contenuto || ""
    };

    const descrizione_lunga = await generaDescrizioneLunga(prodotto);
    const descrizione_breve = await generaDescrizioneBreve(descrizione_lunga);

    return {
      success: true,
      descrizione_lunga,
      descrizione_breve
    };

  } catch (err) {
    console.error("❌ Errore generaDescrizioneAI:", err);
    return {
      success: false,
      error: "Errore generazione AI"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex POST /api/prodotti/genera-descrizione-ai)
========================================================= */
async function genera(req) {
  console.log("[DEBUG prodotti-ai] alias genera() → generaDescrizioneAI()");
  return generaDescrizioneAI(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  generaDescrizioneAI,
  genera
};
