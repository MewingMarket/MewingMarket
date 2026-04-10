/**
 * =========================================================
 * API AI — Generazione descrizioni prodotto
 * Versione 2026.300 — Sistema descrizioni unificato
 * - RIMOSSA descrizione_email
 * - descrizione_lunga = fonte principale (PDF + YouTube)
 * - descrizione_breve = riassunto automatico
 * =========================================================
 */

const express = require("express");
const path = require("path");

const router = express.Router();

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const {
  generaDescrizioneLunga,
  generaDescrizioneBreve
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

    // 1) Descrizione lunga (PDF + YouTube → testo di vendita)
    const descrizione_lunga = await generaDescrizioneLunga(prodotto);

    // 2) Descrizione breve (riassunto automatico)
    const descrizione_breve = await generaDescrizioneBreve(descrizione_lunga);

    return res.json({
      success: true,
      descrizione_lunga,
      descrizione_breve
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
