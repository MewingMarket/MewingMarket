/**
 * =========================================================
 * BOOTSTRAP — versione Render‑Friendly
 * Nessuna sync Airtable qui dentro.
 * Nessun blocco prima del listen.
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto
const { syncYouTube } = require(path.join(process.cwd(), "app/services/youtube.cjs"));

module.exports = async function bootstrap() {
  console.log("\n====================================");
  console.log("🚀 BOOTSTRAP MewingMarket");
  console.log("====================================\n");

  global.catalogReady = false;

  /* =========================================================
     1) SYNC YOUTUBE (non blocca il server)
  ========================================================== */
  console.log("🎥 Sync YouTube…");
  try {
    await syncYouTube();
    console.log("✅ YouTube completata\n");
  } catch (err) {
    console.error("❌ Errore YouTube:", err?.message || err);
  }

  /* =========================================================
     BOOTSTRAP COMPLETATO
     (Airtable verrà eseguito DOPO il listen)
  ========================================================== */
  console.log("====================================");
  console.log("🎉 BOOTSTRAP COMPLETATO");
  console.log("====================================\n");
};
