// =========================================================
// CRON SYNC — Versione LAZY-SAFE 2060
// Nessun avvio automatico, nessun setInterval globale.
// Esegue SOLO quando chiamato da backendloader o da un endpoint.
// =========================================================

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = async function runCronSyncLazy({ log = console.log, logErr = console.error } = {}) {
  const DATA_BACKUP = path.join(process.cwd(), "app/data");
  const DATA_PERSIST = "/var/data/json";

  // 🔒 Protezione: impedisce esecuzioni sovrapposte
  if (global.__CRON_SYNC_RUNNING__) {
    log("🟧 [SYNC] Ignorato: processo già in esecuzione");
    return { ok: false, skip: true, reason: "running" };
  }

  global.__CRON_SYNC_RUNNING__ = true;

  const MAX_RUNTIME_MS = 15_000;
  const MAX_FILES = 200;
  const MAX_FILE_SIZE = 5 * 1024 * 1024;

  const startTime = Date.now();

  function safeHash(buf) {
    return crypto.createHash("sha256").update(buf).digest("hex");
  }

  try {
    if (!fs.existsSync(DATA_PERSIST)) {
      logErr("❌ [SYNC] Cartella persistente mancante");
      global.__CRON_SYNC_RUNNING__ = false;
      return { ok: false, error: "missing_folder" };
    }

    let files = fs.readdirSync(DATA_PERSIST).filter(f => f.endsWith(".json"));

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

      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        logErr("❌ [SYNC] Timeout raggiunto. Interrotto.");
        break;
      }
    }

    log("✅ [SYNC] Completato");

  } catch (err) {
    logErr("❌ [SYNC] Errore generale:", err.message);
  }

  global.__CRON_SYNC_RUNNING__ = false;

  return { ok: true, elapsed: Date.now() - startTime };
};
