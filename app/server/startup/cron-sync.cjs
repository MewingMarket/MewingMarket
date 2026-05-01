/**
 * =========================================================
 * CRON SYNC — SAFE MODE
 * Sincronizzazione /var/data/json → app/data
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = function startCronSync(app, { log, logErr }) {
  const DATA_BACKUP = path.join(process.cwd(), "app/data");
  const DATA_PERSIST = "/var/data/json";

  // 🔒 Protezione: impedisce esecuzioni sovrapposte
  let running = false;

  // 🔒 Timeout di sicurezza (evita loop infiniti)
  const MAX_RUNTIME_MS = 15_000;

  // 🔒 Limiti di sicurezza
  const MAX_FILES = 200;          // evita OOM se la cartella esplode
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB per file

  function safeHash(buf) {
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  async function syncOnce() {
    if (running) {
      log("🟧 [SYNC] Ignorato: processo già in esecuzione");
      return;
    }

    running = true;
    const startTime = Date.now();

    try {
      if (!fs.existsSync(DATA_PERSIST)) {
        logErr("❌ [SYNC] Cartella persistente mancante");
        running = false;
        return;
      }

      let files = fs.readdirSync(DATA_PERSIST).filter(f => f.endsWith(".json"));

      // 🔒 Limite massimo file
      if (files.length > MAX_FILES) {
        logErr(`❌ [SYNC] Troppi file (${files.length}). Limite: ${MAX_FILES}`);
        files = files.slice(0, MAX_FILES);
      }

      log(`⏱️ [SYNC] Avvio sincronizzazione (${files.length} file)`);

      for (const file of files) {
        const src = path.join(DATA_PERSIST, file);
        const dst = path.join(DATA_BACKUP, file);

        try {
          const stat = fs.statSync(src);

          // 🔒 Limite dimensione file
          if (stat.size > MAX_FILE_SIZE) {
            logErr(`❌ [SYNC] ${file} troppo grande (${stat.size} bytes). Skippato.`);
            continue;
          }

          const srcBuf = fs.readFileSync(src);
          const srcHash = safeHash(srcBuf);

          let dstHash = null;
          if (fs.existsSync(dst)) {
            const dstBuf = fs.readFileSync(dst);
            dstHash = safeHash(dstBuf);
          }

          if (srcHash !== dstHash) {
            fs.writeFileSync(dst, srcBuf);
            log(`🟩 [SYNC] ${file} aggiornato`);
          } else {
            log(`🟦 [SYNC] ${file} nessun cambiamento`);
          }

        } catch (err) {
          logErr(`❌ [SYNC] Errore su ${file}: ${err.message}`);
        }

        // 🔒 Timeout globale
        if (Date.now() - startTime > MAX_RUNTIME_MS) {
          logErr("❌ [SYNC] Timeout raggiunto. Interrotto.");
          break;
        }
      }

      log("✅ [SYNC] Completato");

    } catch (err) {
      logErr("❌ [SYNC] Errore generale:", err.message);
    }

    running = false;
  }

  // Esegui subito al boot
  syncOnce();

  // Ogni 10 minuti (solo se non è in esecuzione)
  setInterval(syncOnce, 10 * 60 * 1000);
};
