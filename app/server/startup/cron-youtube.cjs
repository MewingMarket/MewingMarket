// =========================================================
// cron-youtube.cjs — Versione LAZY-SAFE 2060
// Nessun avvio automatico, nessun setInterval globale.
// Esegue SOLO quando chiamato da backendloader o da un endpoint.
// =========================================================

const path = require("path");

// Import LAZY del servizio YouTube
function loadSyncYouTube() {
  return require(path.join(process.cwd(), "app/services/youtube.cjs")).syncYouTube;
}

module.exports = async function startYouTubeCronLazy() {
  console.log("⏳ [YouTubeCron 2060] Avvio sync ON-DEMAND (SAFE MODE)");

  // 🔒 Protezione: impedisce esecuzioni sovrapposte
  if (global.__YOUTUBE_CRON_RUNNING__) {
    console.log("🟧 [YouTubeCron] Ignorato: processo già in esecuzione");
    return { ok: false, skip: true, reason: "running" };
  }

  global.__YOUTUBE_CRON_RUNNING__ = true;

  const MAX_RUNTIME_MS = 20_000; // 20 secondi
  const start = Date.now();

  try {
    const syncYouTube = loadSyncYouTube();

    console.log("🔄 [YouTubeCron] Avvio sync protetto…");

    // Timeout di sicurezza
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout YouTube")), MAX_RUNTIME_MS)
    );

    // Esecuzione protetta
    await Promise.race([
      syncYouTube(),
      timeoutPromise
    ]);

    console.log("🟩 [YouTubeCron] Sync completato");

  } catch (err) {
    console.error("❌ [YouTubeCron] Errore:", err.message);
  }

  // Protezione RAM / runtime
  const elapsed = Date.now() - start;
  if (elapsed > MAX_RUNTIME_MS) {
    console.error("🟥 [YouTubeCron] Runtime eccessivo, skip consigliato");
  }

  global.__YOUTUBE_CRON_RUNNING__ = false;

  return { ok: true, elapsed };
};
