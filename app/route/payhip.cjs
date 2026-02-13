// route/payhip.cjs — VERSIONE DEFINITIVA

const express = require("express");
const router = express.Router();
const { syncPayhip } = require("../services/payhip.cjs");

/* =========================================================
   SYNC MANUALE PAYHIP → AIRTABLE → products.json
========================================================= */
router.get("/sync", async (req, res) => {
  console.log("⏳ Richiesta sincronizzazione manuale del catalogo Payhip...");

  try {
    const result = await syncPayhip();

    if (!result || !result.success) {
      console.error("❌ Sync Payhip fallita:", result?.reason || "Errore sconosciuto");
      return res.status(500).json({
        success: false,
        error: result?.reason || "Errore durante la sincronizzazione Payhip"
      });
    }

    console.log(`✅ Sync Payhip completata: ${result.ok}/${result.count} prodotti aggiornati.`);

    return res.json({
      success: true,
      updated: result.ok,
      failed: result.fail,
      total: result.count
    });

  } catch (err) {
    console.error("❌ Errore generale durante la sincronizzazione Payhip:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Errore interno durante la sincronizzazione Payhip"
    });
  }
});

module.exports = router;
