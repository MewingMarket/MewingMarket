/**
 * app/server/startup/startup-cron.cjs
 * Cron job periodici (Payhip, Airtable, YouTube, Products)
 */

const cron = require("node-cron");

// PATCH: i servizi Payhip e YouTube stanno in app/services/
const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");

// PATCH: Airtable e loadProducts stanno in app/modules/ (2 livelli, non 3)
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

module.exports = function startCronJobs() {
  try {
    if (typeof global.logEvent === "function") {
      global.logEvent("cron_init", { time: new Date().toISOString() });
    }

    /* =========================================================
       CRON PAYHIP — ogni 10 minuti
    ========================================================== */
    cron.schedule("*/10 * * * *", async () => {
      try {
        await syncPayhip();
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_payhip_ok", {});
        }
      } catch (err) {
        console.error("Cron Payhip error:", err);
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_payhip_error", {
            error: err?.message || "unknown"
          });
        }
      }
    });

    /* =========================================================
       CRON AIRTABLE — ogni 15 minuti
    ========================================================== */
    cron.schedule("*/15 * * * *", async () => {
      try {
        await syncAirtable();
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_airtable_ok", {});
        }
      } catch (err) {
        console.error("Cron Airtable error:", err);
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_airtable_error", {
            error: err?.message || "unknown"
          });
        }
      }
    });

    /* =========================================================
       CRON YOUTUBE — ogni 30 minuti
    ========================================================== */
    cron.schedule("*/30 * * * *", async () => {
      try {
        await syncYouTube();
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_youtube_ok", {});
        }
      } catch (err) {
        console.error("Cron YouTube error:", err);
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_youtube_error", {
            error: err?.message || "unknown"
          });
        }
      }
    });

    /* =========================================================
       CRON PRODOTTI — ogni 5 minuti
    ========================================================== */
    cron.schedule("*/5 * * * *", async () => {
      try {
        await loadProducts();
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_products_ok", {});
        }
      } catch (err) {
        console.error("Cron Products error:", err);
        if (typeof global.logEvent === "function") {
          global.logEvent("cron_products_error", {
            error: err?.message || "unknown"
          });
        }
      }
    });

    if (typeof global.logEvent === "function") {
      global.logEvent("cron_ready", { time: new Date().toISOString() });
    }

  } catch (err) {
    console.error("❌ Errore startCronJobs:", err);
    if (typeof global.logEvent === "function") {
      global.logEvent("cron_fatal_error", {
        error: err?.message || "unknown"
      });
    }
  }
};
