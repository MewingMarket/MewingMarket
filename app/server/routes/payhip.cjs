/**
 * app/server/routes/payhip.cjs
 * Sync manuale Payhip → Airtable → products.json
 */

const { syncPayhip } = require("../services/payhip.cjs");

// PATCH: percorso corretto verso airtable.cjs
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

module.exports = function (app) {

  /* =========================================================
     SYNC MANUALE PAYHIP → AIRTABLE → products.json
  ========================================================== */
  app.get("/payhip/sync", async (req, res) => {
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

      console.log(`📦 Sync Payhip completata: ${result.ok}/${result.count} prodotti aggiornati.`);

      // ⭐ PATCH: aggiorna Airtable e products.json
      await syncAirtable();
      loadProducts();

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

};
