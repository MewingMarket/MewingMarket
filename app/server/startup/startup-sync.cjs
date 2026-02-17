/**
 * app/server/startup/startup-sync.cjs
 * Sincronizzazioni iniziali all'avvio del server
 */

const { syncPayhip } = require("../../modules/payhip.cjs");
const { syncAirtable } = require("../../modules/airtable.cjs");
const { syncYouTube } = require("../../modules/youtube.cjs");
const { loadProducts } = require("../../modules/products.cjs");

module.exports = async function startupSync() {
  try {
    if (typeof global.logEvent === "function") {
      global.logEvent("startup_begin", { time: new Date().toISOString() });
    }

    /* =========================================================
       SYNC PAYHIP
    ========================================================== */
    try {
      await syncPayhip();
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_payhip_ok", {});
      }
    } catch (err) {
      console.error("Errore syncPayhip:", err);
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_payhip_error", {
          error: err?.message || "unknown"
        });
      }
    }

    /* =========================================================
       SYNC AIRTABLE
    ========================================================== */
    try {
      await syncAirtable();
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_airtable_ok", {});
      }
    } catch (err) {
      console.error("Errore syncAirtable:", err);
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_airtable_error", {
          error: err?.message || "unknown"
        });
      }
    }

    /* =========================================================
       SYNC YOUTUBE
    ========================================================== */
    try {
      await syncYouTube();
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_youtube_ok", {});
      }
    } catch (err) {
      console.error("Errore syncYouTube:", err);
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_sync_youtube_error", {
          error: err?.message || "unknown"
        });
      }
    }

    /* =========================================================
       CARICAMENTO PRODOTTI
    ========================================================== */
    try {
      await loadProducts();
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_products_loaded", {});
      }
    } catch (err) {
      console.error("Errore loadProducts:", err);
      if (typeof global.logEvent === "function") {
        global.logEvent("startup_products_error", {
          error: err?.message || "unknown"
        });
      }
    }

    if (typeof global.logEvent === "function") {
      global.logEvent("startup_complete", { time: new Date().toISOString() });
    }

  } catch (err) {
    console.error("❌ Errore startupSync:", err);
    if (typeof global.logEvent === "function") {
      global.logEvent("startup_fatal_error", {
        error: err?.message || "unknown"
      });
    }
  }
};
