/**
 * app/server/startup/startup-sync.cjs
 * Sincronizzazioni iniziali all'avvio del server (versione resiliente)
 */

const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

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
      global.logEvent?.("startup_sync_payhip_ok", {});
    } catch (err) {
      console.error("Errore syncPayhip:", err);
      global.logEvent?.("startup_sync_payhip_error", { error: err?.message || "unknown" });
    }

    /* =========================================================
       SYNC AIRTABLE (RESILIENTE)
    ========================================================== */
    try {
      if (!process.env.AIRTABLE_API_KEY) {
        console.log("⏭️ Airtable sync skipped: missing API key (retry in 5s)");
        global.logEvent?.("startup_sync_airtable_skipped", { reason: "missing_api_key" });

        // Ritenta dopo 5 secondi
        setTimeout(async () => {
          try {
            await syncAirtable();
            global.logEvent?.("startup_sync_airtable_ok_after_retry", {});
          } catch (err2) {
            console.error("Errore syncAirtable (retry):", err2);
            global.logEvent?.("startup_sync_airtable_error_retry", {
              error: err2?.message || "unknown"
            });
          }
        }, 5000);
      } else {
        await syncAirtable();
        global.logEvent?.("startup_sync_airtable_ok", {});
      }
    } catch (err) {
      console.error("Errore syncAirtable:", err);
      global.logEvent?.("startup_sync_airtable_error", { error: err?.message || "unknown" });
    }

    /* =========================================================
       SYNC YOUTUBE
    ========================================================== */
    try {
      await syncYouTube();
      global.logEvent?.("startup_sync_youtube_ok", {});
    } catch (err) {
      console.error("Errore syncYouTube:", err);
      global.logEvent?.("startup_sync_youtube_error", { error: err?.message || "unknown" });
    }

    /* =========================================================
       CARICAMENTO PRODOTTI
    ========================================================== */
    try {
      await loadProducts();
      global.logEvent?.("startup_products_loaded", {});
    } catch (err) {
      console.error("Errore loadProducts:", err);
      global.logEvent?.("startup_products_error", { error: err?.message || "unknown" });
    }

    global.logEvent?.("startup_complete", { time: new Date().toISOString() });

  } catch (err) {
    console.error("❌ Errore startupSync:", err);
    global.logEvent?.("startup_fatal_error", { error: err?.message || "unknown" });
  }
};
