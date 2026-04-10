/**
 * =========================================================
 * API AI — Generazione descrizioni prodotto
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");

const router = express.Router();

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const {
  generaDescrizioneLunga,
  generaDescrizioneBreve,
  generaDescrizioneEmail
} = R("modules/catalogo-ai.cjs");

/* ============================================================
   POST /api/prodotti/genera-descrizione-ai
============================================================ */
router.post("/genera-descrizione-ai", async (req, res) => {
  try {
    const { titolo, contenuto } = req.body || {};

    if (!titolo) {
      return res.status(400).json({
        success: false,
        error: "Titolo mancante"
      });
    }

    const prodotto = {
      titolo,
      contenuto: contenuto || ""
    };

    // 1) Descrizione lunga
    const descrizione_lunga = await generaDescrizioneLunga(prodotto);

    // 2) Descrizione breve
    const descrizione_breve = await generaDescrizioneBreve(descrizione_lunga);

    // 3) Descrizione email
    const descrizione_email = await generaDescrizioneEmail(descrizione_lunga);

    return res.json({
      success: true,
      descrizione_lunga,
      descrizione_breve,
      descrizione_email
    });

  } catch (err) {
    console.error("❌ Errore AI:", err);
    return res.status(500).json({
      success: false,
      error: "Errore generazione AI"
    });
  }
});

module.exports = router;
