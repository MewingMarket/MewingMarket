/**
 * =========================================================
 * File: app/server/server.cjs
 * Entry point del server — versione DEFINITIVA (NO SYNC API)
 * Patch B — Blindatura totale (SOFT)
 * =========================================================
 */

// =========================================================
// 🔥 CATTURA ERRORI NASCOSTI (ANTI-CRASH GLOBALE)
// =========================================================
process.on("uncaughtException", err => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", err => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

// =========================================================
// 🕒 LOGGER UNIVERSALE (TIMESTAMP + COLORI)
// =========================================================
function log(...args) {
  const ts = new Date().toISOString();
  console.log(`\x1b[36m[${ts}]\x1b[0m`, ...args);
}
function logErr(...args) {
  const ts = new Date().toISOString();
  console.error(`\x1b[31m[${ts}]\x1b[0m`, ...args);
}

log(">> SERVER STARTING…");
log(">> PACKAGE TYPE:", require("../../package.json").type);

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const crypto = require("crypto");

log(">> EXPRESS LOADED");

const app = express();
app.disable("x-powered-by");

// ROOT = /project/src/app
const ROOT = path.resolve("app");
log(">> ROOT PATH:", ROOT);

// =========================================================
// 🛡 ANTI-DOPPIO BOOTSTRAP (BUG RENDER)
// =========================================================
if (global.__server_started) {
  logErr("⚠️ SERVER GIÀ AVVIATO — Render doppio processo evitato");
  return;
}
global.__server_started = true;

// =========================================================
// 🩺 HEALTH CHECK
// =========================================================
let BOOTSTRAP_OK = false;

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    bootstrap: BOOTSTRAP_OK,
    time: new Date().toISOString()
  });
});

// =========================================================
// AVVIO SEQUENZIALE
// =========================================================
const wait = (ms) => new Promise(res => res(ms));

(async () => {
  log(">> LOADING logging.cjs");
  await wait(200);
  require("./services/logging.cjs");

  log(">> APPLYING PARSER MIDDLEWARE");
  await wait(200);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  // =========================================================
  // LOGGER UNIVERSALE REQUEST
  // =========================================================
  app.use((req, res, next) => {
    log(`📥 ${req.method} ${req.url}`);
    next();
  });

  log(">> LOADING cache.cjs");
  await wait(200);
  require("./middleware/cache.cjs")(app);

  log(">> LOADING uploads.cjs");
  await wait(200);
  require("./middleware/uploads.cjs")(app);

  log(">> LOADING context.cjs");
  await wait(200);
  require("./middleware/context.cjs")(app);

  // =========================================================
  // STATICI FRONTEND
  // =========================================================
  log(">> REGISTER STATIC ROUTES");
  await wait(200);
  app.use(express.static(path.resolve("app/public")));
  app.use("/data", express.static(path.resolve("app/data")));

  // =========================================================
  // ADMIN
  // =========================================================
  log(">> REGISTER ADMIN ROUTES");
  await wait(200);
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  // =========================================================
  // API
  // =========================================================
  log(">> LOADING router.cjs");
  await wait(200);
  const router = require("./router.cjs");
  app.use("/api", router);

  // =========================================================
  // DEBUG DB (HTML)
  // =========================================================
  log(">> LOADING debug-db.cjs");
  await wait(200);
  app.use("/api", require("./routes/debug-db.cjs"));

  // =========================================================
  // ROUTE FRONTEND
  // =========================================================
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
  // BOOTSTRAP
  // =========================================================
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
    if (!PORT) {
      logErr("❌ ERRORE: Render non ha assegnato la porta!");
    }

    log(">> CALLING app.listen…");
    require("./startup/cron-youtube.cjs")();

    app.listen(PORT, () => {
      log(`🎉 SERVER LISTENING ON PORT ${PORT}`);
      log("⚡ Server pronto e online");

      // =========================================================
      // SYNC JSON INIZIALE
      // =========================================================
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

      // =========================================================
      // LOG DB INIZIALE + MONITOR
      // =========================================================
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

      // MONITOR CAMBIAMENTI
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

      // =========================================================
      // SYNC INIZIALE YOUTUBE
      // =========================================================
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
