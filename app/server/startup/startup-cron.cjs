/**
 * =========================================================
 * File: app/server/startup/startup-cron.cjs
 * Cron job periodici — versione patchata per nuovo store interno
 * =========================================================
 */

const cron = require("node-cron");

const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable } = require("../../modules/airtable.cjs");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

function canUseAirtable() {
  return AIRTABLE_PAT && AIRTABLE_BASE && AIRTABLE_TABLE_NAME;
}

module.exports = function startCronJobs() {
  console.log("⏱️ Cron attivi (post-bootstrap)");

  /* =========================================================
     1) YOUTUBE — ogni 30 minuti
     (solo se Airtable è configurato)
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
     2) AIRTABLE — ogni 15 minuti
     Deve essere DOPO YouTube
  ========================================================== */
  cron.schedule("*/15 * * * *", async () => {
    if (!canUseAirtable()) return;

    console.log("📡 [CRON] Sync Airtable…");
    try {
      await syncAirtable();
      console.log("🟢 [CRON] Airtable OK (catalogReady = true)");
    } catch (err) {
      console.error("❌ [CRON] Airtable error:", err);
    }
  });
};
