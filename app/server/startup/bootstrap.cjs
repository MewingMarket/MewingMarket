/**
 * =========================================================
 * File: app/server/startup/bootstrap.cjs
 * Bootstrap completo — YouTube → Airtable → Catalogo
 * Versione patchata per nuovo store interno
 * =========================================================
 */

const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable } = require("../../modules/airtable.cjs");

module.exports = async function bootstrap() {
  console.log("\n====================================");
  console.log("🚀 BOOTSTRAP MewingMarket");
  console.log("====================================\n");

  // Il catalogo sarà pronto solo dopo sync Airtable
  global.catalogReady = false;

  /* =========================================================
     1) YOUTUBE SYNC (opzionale)
  ========================================================== */
  console.log("🎥 Sync YouTube…");
  try {
    await syncYouTube();
    console.log("✅ YouTube completata\n");
  } catch (err) {
    console.error("❌ Errore YouTube:", err);
  }

  /* =========================================================
     2) AIRTABLE SYNC (fonte principale del catalogo)
  ========================================================== */
  console.log("📡 Sync Airtable…");
  try {
    await syncAirtable();
    console.log("🟢 Airtable completata (catalogReady = true)\n");
  } catch (err) {
    console.error("❌ Errore Airtable:", err);
  }

  /* =========================================================
     BOOTSTRAP COMPLETATO
  ========================================================== */
  console.log("====================================");
  console.log("🎉 BOOTSTRAP COMPLETATO");
  console.log("====================================\n");
};
