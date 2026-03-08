/**
 * =========================================================
 * BOOTSTRAP FAILSAFE — mai più blocchi su Render
 * =========================================================
 */

const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable } = require("../../modules/airtable.cjs");

// Timeout helper
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
    )
  ]);
}

module.exports = async function bootstrap() {
  console.log("\n====================================");
  console.log("🚀 BOOTSTRAP MewingMarket");
  console.log("====================================\n");

  global.catalogReady = false;

  /* =========================================================
     1) YOUTUBE SYNC (con timeout)
  ========================================================== */
  console.log("🎥 Sync YouTube…");
  try {
    await withTimeout(syncYouTube(), 8000, "YouTube sync");
    console.log("✅ YouTube completata\n");
  } catch (err) {
    console.error("❌ Errore YouTube:", err.message);
  }

  /* =========================================================
     2) AIRTABLE SYNC (con timeout)
  ========================================================== */
  console.log("📡 Sync Airtable…");
  try {
    await withTimeout(syncAirtable(), 10000, "Airtable sync");
    console.log("🟢 Airtable completata (catalogReady = true)\n");
    global.catalogReady = true;
  } catch (err) {
    console.error("❌ Errore Airtable:", err.message);
  }

  /* =========================================================
     BOOTSTRAP COMPLETATO
  ========================================================== */
  console.log("====================================");
  console.log("🎉 BOOTSTRAP COMPLETATO");
  console.log("====================================\n");
};
