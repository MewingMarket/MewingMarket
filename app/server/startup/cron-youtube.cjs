const path = require("path");
const crypto = require("crypto");

// PATCH: require assoluto
const { syncYouTube } = require(path.join(process.cwd(), "app/services/youtube.cjs"));

module.exports = function startYouTubeCron() {
  console.log("⏳ Avvio cron YouTube (SAFE MODE HARD)…");

  // 🔒 Protezione: impedisce esecuzioni sovrapposte
  let running = false;

  // 🔒 Timeout massimo per evitare loop infiniti
  const MAX_RUNTIME_MS = 20_000; // 20 secondi

  // 🔒 Limite massimo dimensione feed (5MB)
  const MAX_FEED_SIZE = 5 * 1024 * 1024;

  async function safeSync() {
    if (running) {
      console.log("🟧 Cron YouTube ignorato: processo già in esecuzione");
      return;
    }

    running = true;
    const start = Date.now();

    try {
      console.log("🔄 Cron YouTube: avvio sync (SAFE)…");

      // =========================================================
      // 1) TIMEOUT DI SICUREZZA
      // =========================================================
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout YouTube")), MAX_RUNTIME_MS)
      );

      // =========================================================
      // 2) ESECUZIONE PROTETTA
      // =========================================================
      const result = await Promise.race([
        syncYouTube(),
        timeoutPromise
      ]);

      console.log("🟩 Cron YouTube completato (SAFE)");

    } catch (err) {
      console.error("❌ Cron YouTube errore SAFE:", err.message);
    }

    // =========================================================
    // 3) PROTEZIONE RAM: se runtime troppo lungo → skip prossimo ciclo
    // =========================================================
    const elapsed = Date.now() - start;
    if (elapsed > MAX_RUNTIME_MS) {
      console.error("🟥 Cron YouTube ha superato il limite di runtime. Skip prossimo ciclo.");
    }

    running = false;
  }

  // =========================================================
  // ESEGUI SUBITO UNA VOLTA (ma in SAFE MODE)
  // =========================================================
  safeSync();

  // =========================================================
  // OGNI 10 MINUTI (solo se non è in esecuzione)
  // =========================================================
  setInterval(safeSync, 10 * 60 * 1000);
};
