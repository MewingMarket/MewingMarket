const { syncYouTube } = require("../../services/youtube.cjs");

module.exports = function startYouTubeCron() {
  console.log("⏳ Avvio cron YouTube (ogni 10 minuti)…");

  setInterval(async () => {
    try {
      console.log("🔄 Cron YouTube: avvio sync…");
      await syncYouTube();
      console.log("✅ Cron YouTube completato");
    } catch (err) {
      console.error("❌ Cron YouTube errore:", err.message);
    }
  }, 10 * 60 * 1000); // ogni 10 minuti
};
