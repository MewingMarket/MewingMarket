/**
 * app/server/startup/startup-cron.cjs
 * Cron job periodici — versione ottimizzata (post-bootstrap)
 */

const cron = require("node-cron");

const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

function canUseAirtable() {
  return AIRTABLE_PAT && AIRTABLE_BASE && AIRTABLE_TABLE_NAME;
}

module.exports = function startCronJobs() {
  console.log("⏱️ Cron attivi (post-bootstrap)");

  /* =========================================================
     1) PAYHIP — ogni 10 minuti
  ========================================================== */
  cron.schedule("*/10 * * * *", async () => {
    console.log("🔄 [CRON] Sync Payhip…");
    try {
      await syncPayhip();
      console.log("✅ [CRON] Payhip OK");
    } catch (err) {
      console.error("❌ [CRON] Payhip error:", err);
    }
  });

  /* =========================================================
     2) YOUTUBE — ogni 30 minuti
  ========================================================== */
  cron.schedule("*/30 * * * *", async () => {
    if (!canUseAirtable()) return;

    console.log("🎥 [CRON] Sync YouTube…");
    try {
      await syncYouTube();
      console.log("✅ [CRON] YouTube OK");
    } catch (err) {
      console.error("❌ [CRON] YouTube error:", err);
    }
  });

  /* =========================================================
     3) AIRTABLE — ogni 15 minuti
     Deve essere DOPO Payhip e YouTube
  ========================================================== */
  cron.schedule("*/15 * * * *", async () => {
    if (!canUseAirtable()) return;

    console.log("📡 [CRON] Sync Airtable…");
    try {
      await syncAirtable();
      console.log("✅ [CRON] Airtable OK");

      // Aggiorna products.json dopo Airtable
      await loadProducts();
      console.log("📦 [CRON] Catalogo aggiornato");

    } catch (err) {
      console.error("❌ [CRON] Airtable error:", err);
    }
  });
};
