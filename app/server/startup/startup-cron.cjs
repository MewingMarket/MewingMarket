/**
 * app/server/startup/startup-cron.cjs
 * Cron job periodici (Payhip, Airtable, YouTube, Products)
 */

const cron = require("node-cron");

// PATCH: i servizi Payhip e YouTube stanno in app/services/
const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");

// PATCH: Airtable e loadProducts stanno in app/modules/
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

// PATCH: usa le tue variabili reali
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// Guard di sicurezza
function canUseAirtable() {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE || !AIRTABLE_TABLE_NAME) {
    console.log("⏭️ Cron Airtable skipped: missing PAT / BASE / TABLE_NAME");
    return false;
  }
  return true;
}

module.exports = function startCronJobs() {
  try {
    global.logEvent?.("cron_init", { time: new Date().toISOString() });

    /* =========================================================
       CRON PAYHIP — ogni 10 minuti
    ========================================================== */
    cron.schedule("*/10 * * * *", async () => {
      try {
        await syncPayhip();
        global.logEvent?.("cron_payhip_ok", {});
      } catch (err) {
        console.error("Cron Payhip error:", err);
        global.logEvent?.("cron_payhip_error", { error: err?.message || "unknown" });
      }
    });

    /* =========================================================
       CRON AIRTABLE — ogni 15 minuti (RESILIENTE)
    ========================================================== */
    cron.schedule("*/15 * * * *", async () => {
      try {
        if (!canUseAirtable()) {
          global.logEvent?.("cron_airtable_skipped", { reason: "missing_credentials" });
          return;
        }

        await syncAirtable();
        global.logEvent?.("cron_airtable_ok", {});

      } catch (err) {
        console.error("Cron Airtable error:", err);
        global.logEvent?.("cron_airtable_error", { error: err?.message || "unknown" });
      }
    });

    /* =========================================================
       CRON YOUTUBE — ogni 30 minuti (RESILIENTE)
    ========================================================== */
    cron.schedule("*/30 * * * *", async () => {
      try {
        // YouTube aggiorna Airtable → deve essere resiliente
        if (!canUseAirtable()) {
          console.log("⏭️ Cron YouTube skipped: Airtable non configurato");
          global.logEvent?.("cron_youtube_skipped", { reason: "missing_credentials" });
          return;
        }

        await syncYouTube();
        global.logEvent?.("cron_youtube_ok", {});

      } catch (err) {
        console.error("Cron YouTube error:", err);
        global.logEvent?.("cron_youtube_error", { error: err?.message || "unknown" });
      }
    });

    /* =========================================================
       CRON PRODOTTI — ogni 5 minuti
    ========================================================== */
    cron.schedule("*/5 * * * *", async () => {
      try {
        await loadProducts();
        global.logEvent?.("cron_products_ok", {});
      } catch (err) {
        console.error("Cron Products error:", err);
        global.logEvent?.("cron_products_error", { error: err?.message || "unknown" });
      }
    });

    global.logEvent?.("cron_ready", { time: new Date().toISOString() });

  } catch (err) {
    console.error("❌ Errore startCronJobs:", err);
    global.logEvent?.("cron_fatal_error", { error: err?.message || "unknown" });
  }
};
