/**
 * app/server/startup/startup-sync.cjs
 * Sincronizzazioni iniziali all'avvio del server (versione resiliente + READY SYSTEM)
 */

const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

// Variabili reali
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// Guard di sicurezza
function canUseAirtable() {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE || !AIRTABLE_TABLE_NAME) {
    console.log("⏭️ Airtable sync skipped: missing PAT / BASE / TABLE_NAME");
    return false;
  }
  return true;
}

module.exports = async function startupSync() {
  try {
    global.logEvent?.("startup_begin", { time: new Date().toISOString() });

    /* =========================================================
       1) CARICAMENTO PRODOTTI DA FILE (SUBITO)
       - Garantisce che il bot abbia almeno l’ultimo catalogo salvato
       - Se ci sono prodotti → catalogReady = true
    ========================================================== */
    try {
      await loadProducts();
      global.logEvent?.("startup_products_loaded", {});
    } catch (err) {
      console.error("Errore loadProducts:", err);
      global.logEvent?.("startup_products_error", { error: err?.message || "unknown" });
    }

    /* =========================================================
       2) SYNC PAYHIP
    ========================================================== */
    try {
      await syncPayhip();
      global.logEvent?.("startup_sync_payhip_ok", {});
    } catch (err) {
      console.error("Errore syncPayhip:", err);
      global.logEvent?.("startup_sync_payhip_error", { error: err?.message || "unknown" });
    }

    /* =========================================================
       3) SYNC AIRTABLE (RESILIENTE)
       - Quando finisce → catalogReady = true
    ========================================================== */
    try {
      if (!canUseAirtable()) {
        console.log("⏭️ Airtable sync skipped: missing credentials (retry in 5s)");
        global.logEvent?.("startup_sync_airtable_skipped", { reason: "missing_credentials" });

        // Retry dopo 5 secondi
        setTimeout(async () => {
          try {
            if (!canUseAirtable()) return;
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
       4) SYNC YOUTUBE (RESILIENTE)
    ========================================================== */
    try {
      if (!canUseAirtable()) {
        console.log("⏭️ YouTube sync skipped: Airtable non configurato");
        global.logEvent?.("startup_sync_youtube_skipped", { reason: "missing_credentials" });
      } else {
        await syncYouTube();
        global.logEvent?.("startup_sync_youtube_ok", {});
      }
    } catch (err) {
      console.error("Errore syncYouTube:", err);
      global.logEvent?.("startup_sync_youtube_error", { error: err?.message || "unknown" });
    }

    global.logEvent?.("startup_complete", { time: new Date().toISOString() });

  } catch (err) {
    console.error("❌ Errore startupSync:", err);
    global.logEvent?.("startup_fatal_error", { error: err?.message || "unknown" });
  }
};
