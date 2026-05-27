// =========================================================
// BOOTSTRAP — Versione LAZY-SAFE 2060
// Nessun sync automatico. Nessun blocco al boot.
// Esegue SOLO quando chiamato da backendloader.
// =========================================================

const path = require("path");

// Import LAZY del servizio YouTube
function loadSyncYouTube() {
  return require(path.join(process.cwd(), "app/services/youtube.cjs")).syncYouTube;
}

module.exports = async function bootstrapLazy() {
  console.log("\n====================================");
  console.log("🚀 BOOTSTRAP MewingMarket — LAZY SAFE 2060");
  console.log("====================================\n");

  try {
    // ============================================================
    // 1) SYNC YOUTUBE (solo se richiesto)
    // ============================================================
    console.log("🎥 Sync YouTube ON-DEMAND…");

    try {
      const syncYouTube = loadSyncYouTube();
      await syncYouTube();
      console.log("   ✅ YouTube completata\n");
    } catch (err) {
      console.error("   ❌ Errore YouTube:", err?.message || err);
    }

    // ============================================================
    // COMPLETATO
    // ============================================================
    console.log("====================================");
    console.log("🎉 BOOTSTRAP COMPLETATO (LAZY SAFE 2060)");
    console.log("====================================\n");

    return { ok: true };

  } catch (err) {
    console.error("❌ ERRORE BOOTSTRAP:", err);
    return { ok: false, error: err.message };
  }
};
