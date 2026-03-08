/**
 * =========================================================
 * CRON FAILSAFE — mai più sync doppi o appesi
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

// Timeout helper
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout (${ms}ms)`)), ms)
    )
  ]);
}

// Lock per evitare sync doppi
let isSyncingAirtable = false;
let isSyncingYouTube = false;

module.exports = function startCronJobs() {
  console.log("⏱️ Cron attivi (post-bootstrap)");

  /* =========================================================
     1) YOUTUBE — ogni 30 minuti
  ========================================================== */
  cron.schedule("*/30 * * * *", async () => {
    if (!canUseAirtable()) return;
    if (isSyncingYouTube) return;

    isSyncingYouTube = true;
    console.log("🎥 [CRON] Sync YouTube…");

    try {
      await withTimeout(syncYouTube(), 8000, "YouTube sync");
      console.log("✅ [CRON] YouTube OK");
    } catch (err) {
      console.error("❌ [CRON] YouTube error:", err.message);
    }

    isSyncingYouTube = false;
  });

  /* =========================================================
     2) AIRTABLE — ogni 15 minuti
  ========================================================== */
  cron.schedule("*/15 * * * *", async () => {
    if (!canUseAirtable()) return;
    if (isSyncingAirtable) return;

    isSyncingAirtable = true;
    console.log("📡 [CRON] Sync Airtable…");

    try {
      await withTimeout(syncAirtable(), 10000, "Airtable sync");
      console.log("🟢 [CRON] Airtable OK (catalogReady = true)");
      global.catalogReady = true;
    } catch (err) {
      console.error("❌ [CRON] Airtable error:", err.message);
    }

    isSyncingAirtable = false;
  });
};
