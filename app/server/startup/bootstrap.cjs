/**
 * =========================================================
 * BOOTSTRAP REAL‑TIME — nessun timeout, nessun blocco
 * =========================================================
 */

const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable } = require("../../modules/airtable.cjs");

module.exports = async function bootstrap() {
  console.log("\n====================================");
  console.log("🚀 BOOTSTRAP MewingMarket");
  console.log("====================================\n");

  global.catalogReady = false;

  /* =========================================================
     1) SYNC YOUTUBE (non bloccante)
  ========================================================== */
  console.log("🎥 Sync YouTube…");
  try {
    await syncYouTube();
    console.log("✅ YouTube completata\n");
  } catch (err) {
    console.error("❌ Errore YouTube:", err?.message || err);
  }

  /* =========================================================
     2) SYNC AIRTABLE (real‑time, nessun timeout)
     - sarà delta‑based nel nuovo airtable.cjs
     - qui non blocca mai il server
  ========================================================== */
  console.log("📡 Sync Airtable…");
  try {
    await syncAirtable();
    console.log("🟢 Airtable completata (catalogReady = true)\n");
    global.catalogReady = true;
  } catch (err) {
    console.error("❌ Errore Airtable:", err?.message || err);
  }

  /* =========================================================
     BOOTSTRAP COMPLETATO
  ========================================================== */
  console.log("====================================");
  console.log("🎉 BOOTSTRAP COMPLETATO");
  console.log("====================================\n");
};
