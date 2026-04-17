/**
 * =========================================================
 * CRON SYNC — Sincronizzazione /var/data/json → app/data
 * Ogni 10 minuti
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

module.exports = function startCronSync(app, { log, logErr }) {
  const DATA_BACKUP = path.join(process.cwd(), "app/data");
  const DATA_PERSIST = "/var/data/json";

  function syncOnce() {
    try {
      const files = fs.readdirSync(DATA_PERSIST).filter(f => f.endsWith(".json"));

      log(`⏱️ [SYNC] Avvio sincronizzazione (${files.length} file)`);

      files.forEach(file => {
        const src = path.join(DATA_PERSIST, file);
        const dst = path.join(DATA_BACKUP, file);

        try {
          const srcBuf = fs.readFileSync(src);
          const srcHash = require("crypto").createHash("sha256").update(srcBuf).digest("hex");

          let dstHash = null;
          if (fs.existsSync(dst)) {
            const dstBuf = fs.readFileSync(dst);
            dstHash = require("crypto").createHash("sha256").update(dstBuf).digest("hex");
          }

          if (srcHash !== dstHash) {
            fs.writeFileSync(dst, srcBuf);
            log(`🟩 [SYNC] ${file} aggiornato (hash differente)`);
          } else {
            log(`🟦 [SYNC] ${file} nessun aggiornamento`);
          }

        } catch (err) {
          logErr(`❌ [SYNC] Errore su ${file}: ${err.message}`);
        }
      });

      log("✅ [SYNC] Completato");

    } catch (err) {
      logErr("❌ [SYNC] Errore generale:", err.message);
    }
  }

  // Esegui subito al boot
  syncOnce();

  // Ogni 10 minuti
  setInterval(syncOnce, 10 * 60 * 1000);
};
