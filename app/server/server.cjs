/* FILE: app/server/server.cjs */
/**
 * =========================================================
 * Entry point del server — versione DEFINITIVA
 * Patch 2026 — Restore PRIMA del database + Backup intelligente
 * =========================================================
 */

process.on("uncaughtException", err => console.error("🔥 UNCAUGHT EXCEPTION:", err));
process.on("unhandledRejection", err => console.error("🔥 UNHANDLED REJECTION:", err));

console.log("WORKDIR:", process.cwd());
console.log("SERVER FILE:", __filename);

function log(...args) {
  const ts = new Date().toISOString();
  console.log(`\x1b[36m[${ts}]\x1b[0m`, ...args);
}
function logErr(...args) {
  const ts = new Date().toISOString();
  console.error(`\x1b[31m[${ts}]\x1b[0m`, ...args);
}

log(">> SERVER STARTING…");

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

const ROOT = path.resolve("app");
log(">> ROOT PATH:", ROOT);

if (global.__server_started) {
  logErr("⚠️ SERVER GIÀ AVVIATO — istanza duplicata evitata");
  return;
}
global.__server_started = true;

let BOOTSTRAP_OK = false;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    bootstrap: BOOTSTRAP_OK,
    time: new Date().toISOString()
  });
});

const wait = (ms) => new Promise(res => res(ms));

(async () => {
  log(">> LOADING logging.cjs");
  await wait(200);
  require("./services/logging.cjs");

  // =========================================================
  // 🔥 RESTORE PRIMA DEL DATABASE (solo se necessario)
  // =========================================================
  log(">> RESTORE DB & FILES (if needed)");
  await wait(200);
  const { restore } = require("./modules/restore.cjs");
  await restore();

  // 🔥 PATCH: segnala che il restore è completato
  global.__restore_completed = true;

  // =========================================================
  // MIDDLEWARE
  // =========================================================
  log(">> APPLYING PARSER MIDDLEWARE");
  await wait(200);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // =========================================================
  // 🔥 CARICAMENTO DB DOPO RESTORE — DB NULL-SAFE
  // =========================================================
  let db = require("./db/database.cjs");

  if (!db) {
    log("⚠️ DB non inizializzato → forzo restore");
    const { restore } = require("./modules/restore.cjs");
    await restore();

    // PATCH: restore completato → abilita database.cjs
    global.__restore_completed = true;

    db = require("./db/database.cjs");

    if (!db) {
      logErr("❌ ERRORE FATALE: DB ancora null dopo restore");
      process.exit(1);
    }
  }

  app.set("db", db);
  log(">> DB REGISTRATO SU app.set('db')");

  // =========================================================
  // MIDDLEWARE VARI
  // =========================================================
  log(">> LOADING cache.cjs");
  await wait(200);
  require("./middleware/cache.cjs")(app);

  log(">> LOADING uploads.cjs");
  await wait(200);
  require("./middleware/uploads.cjs")(app);

  log(">> LOADING context.cjs");
  await wait(200);
  require("./middleware/context.cjs")(app);

  log(">> LOADING router.cjs");
  await wait(200);
  const router = require("./router.cjs");
  app.use("/api", router);

  log(">> LOADING debug-db.cjs");
  await wait(200);
  app.use("/api", require("./routes/debug-db.cjs"));

  log(">> REGISTER STATIC ROUTES");
  await wait(200);
  app.use(express.static(path.resolve("app/public")));
  app.use("/data", express.static(path.resolve("app/data")));

  log(">> REGISTER ADMIN ROUTES");
  await wait(200);
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  log(">> LOADING FRONTEND ROUTES");
  await wait(200);
  require("./routes/chat.cjs")(app);
  require("./routes/chat-voice.cjs")(app);
  require("./routes/newsletter.cjs")(app);
  require("./routes/meta-feed.cjs")(app);
  require("./routes/product-page.cjs")(app);
  require("./routes/system-status.cjs")(app);
  require("./routes/versione.cjs")(app);

  // =========================================================
  // ENDPOINT UNICO BACKUP + RESTORE
  // =========================================================
  app.get("/admin/backup-restore", async (req, res) => {
    try {
      const { backupGenerale } = require("./modules/backup.cjs");
      const { restore } = require("./modules/restore.cjs");

      await backupGenerale({ source: "manual", force: true });
      await restore();

      // PATCH: restore completato
      global.__restore_completed = true;

      res.json({ ok: true, msg: "Backup + Restore eseguiti" });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  async function startServer() {
    log("====================================");
    log("🚀 STARTING BOOTSTRAP");
    log("====================================");

    try {
      log(">> CALLING bootstrap.cjs");
      await require("./startup/bootstrap.cjs")();
      BOOTSTRAP_OK = true;
      log(">> BOOTSTRAP COMPLETED");
    } catch (err) {
      logErr("❌ BOOTSTRAP ERROR:", err);
    }

    const PORT = process.env.PORT;

    log(">> CALLING app.listen…");
    require("./startup/cron-youtube.cjs")();

    app.listen(PORT, () => {
      log(`🎉 SERVER LISTENING ON PORT ${PORT}`);
      log("⚡ Server pronto e online");

      // =====================================================
      // 💾 BACKUP INIZIALE (forzato, DB aggiornato)
      // =====================================================
      try {
        const { backupGenerale } = require("./modules/backup.cjs");
        backupGenerale({ source: "startup", force: true });
        log("💾 Backup iniziale completato");
      } catch (err) {
        logErr("❌ Errore backup iniziale:", err.message);
      }

      // =====================================================
      // BACKUP PERIODICO OGNI 24 ORE (forzato)
      // =====================================================
      setInterval(async () => {
        try {
          const { backupGenerale } = require("./modules/backup.cjs");
          await backupGenerale({ source: "daily", force: true });
          log("💾 Backup periodico completato");
        } catch (err) {
          logErr("❌ Errore backup periodico:", err.message);
        }
      }, 24 * 60 * 60 * 1000);

      // =====================================================
      // BACKUP INTELLIGENTE OGNI 5 MINUTI (solo se DB cambia)
      // =====================================================
      let lastDbHash = null;
      const DB_FILE = "/var/data/mewingmarket.db";

      setInterval(async () => {
        try {
          if (!fs.existsSync(DB_FILE)) {
            log("⚠️ DB non trovato → skip backup intelligente");
            return;
          }

          const buffer = fs.readFileSync(DB_FILE);
          const hash = crypto.createHash("md5").update(buffer).digest("hex");

          if (hash !== lastDbHash) {
            lastDbHash = hash;

            log("💾 Backup intelligente: DB modificato → salvo snapshot…");
            const { backupGenerale } = require("./modules/backup.cjs");
            await backupGenerale({ source: "auto-5m", force: false });
          } else {
            log("⏳ Backup intelligente: nessuna modifica → skip");
          }

        } catch (err) {
          logErr("❌ Errore backup intelligente:", err.message);
        }
      }, 5 * 60 * 1000);

      // =====================================================
      // AUTOMAZIONI
      // =====================================================
      require("./startup/automazioni.cjs");

      // =====================================================
      // SYNC JSON INIZIALE
      // =====================================================
      setTimeout(async () => {
        log("⏳ Sync iniziale JSON…");
        try {
          const jsonGen = require("./modules/generatore-json.cjs");
          await jsonGen.exportAll();
          log("✅ Sync JSON completato");
        } catch (err) {
          logErr("❌ Errore sync JSON:", err.message);
        }
      }, 1000);

      // =====================================================
      // LOG DB INIZIALE + MONITOR
      // =====================================================
      const db = require("./db/database.cjs");
      const TABLES = ["prodotti", "utenti", "ordini", "vendite"];

      function normalizeRow(row) {
        if (!row) return row;
        const out = {};
        for (const k of Object.keys(row)) {
          out[k] = row[k] === null ? null : row[k];
        }
        return out;
      }

      log("====================================");
      log("📊 LOG INIZIALE DB");
      log("====================================");

      for (const table of TABLES) {
        try {
          const rows = db.prepare(`SELECT * FROM ${table}`).all();
          log(`📌 TABELLA: ${table} (${rows.length})`);
          log(rows.length === 0 ? "→ (vuota)" : rows.map(normalizeRow));
        } catch (err) {
          logErr(`❌ Errore lettura tabella ${table}:`, err.message);
        }
      }

      function hashRows(rows) {
        return crypto.createHash("md5").update(JSON.stringify(rows)).digest("hex");
      }

      let lastHashes = {};

      async function logIfChanged() {
        for (const table of TABLES) {
          try {
            const rows = db.prepare(`SELECT * FROM ${table}`).all();
            const hash = hashRows(rows);

            if (lastHashes[table] !== hash) {
              lastHashes[table] = hash;

              log("====================================");
              log(`📌 AGGIORNAMENTO: ${table}`);
              log("====================================");
              log(rows.length === 0 ? "→ (vuota)" : rows.map(normalizeRow));
            }

          } catch (err) {
            logErr(`❌ ERRORE CRITICO (${table}):`, err.message);
          }
        }
      }

      setInterval(logIfChanged, 5000);

      setTimeout(async () => {
        log("⏳ Sync iniziale YouTube…");
        try {
          const { syncYouTube } = require("../services/youtube.cjs");
          await syncYouTube();
          log("✅ Sync YouTube completata");
        } catch (err) {
          logErr("❌ Errore sync YouTube:", err.message);
        }
      }, 2000);
    });
  }

  log(">> CALLING startServer()");
  startServer();
})();
