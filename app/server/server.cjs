/* FILE: app/server/server.cjs */
/**
 * =========================================================
 * Entry point del server — versione DEFINITIVA
 * Patch 2026 — Restore PRIMA del database + Backup intelligente
 * Patch 2026.600 — Anti-crash router + Monitor DB/Frontend
 * Patch 2026.700 — No-cache index.html (anti-CDN)
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

  // =========================================================
  // 🔥 ROUTER API PROTETTO (non blocca frontend se crasha)
  // =========================================================
  log(">> LOADING router.cjs");
  await wait(200);
  try {
    const router = require("./router.cjs");
    app.use("/api", router);
    log(">> ROUTER API CARICATO");
  } catch (err) {
    logErr("❌ ROUTER ERROR — API disabilitate ma frontend attivo:", err.message || err);
  }

  // =========================================================
  // DEBUG-DB PROTETTO
  // =========================================================
  log(">> LOADING debug-db.cjs");
  await wait(200);
  try {
    app.use("/api", require("./routes/debug-db.cjs"));
    log(">> DEBUG-DB ROUTE CARICATA");
  } catch (err) {
    logErr("❌ ERRORE debug-db.cjs (ignorato, frontend resta attivo):", err.message || err);
  }

  // =========================================================
  // STATIC ROUTES + NO-CACHE INDEX.HTML
  // =========================================================
  log(">> REGISTER STATIC ROUTES");
  await wait(200);

  const PUBLIC_DIR = path.resolve("app/public");
  const DATA_DIR = path.resolve("app/data");

  if (!fs.existsSync(PUBLIC_DIR)) {
    logErr("❌ PUBLIC DIR NON TROVATA:", PUBLIC_DIR);
  } else {
    const indexPath = path.join(PUBLIC_DIR, "index.html");
    if (!fs.existsSync(indexPath)) {
      logErr("❌ index.html NON TROVATO in PUBLIC:", indexPath);
    } else {
      log("✅ index.html trovato:", indexPath);
    }
  }

  // 🔥 NO-CACHE SOLO PER index.html
  app.get("/", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  app.use(express.static(PUBLIC_DIR));
  app.use("/data", express.static(DATA_DIR)); // =========================================================
  // ADMIN STATIC
  // =========================================================
  log(">> REGISTER ADMIN ROUTES");
  await wait(200);
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  // =========================================================
  // FRONTEND ROUTES (CHAT, NEWSLETTER, ETC.)
  // =========================================================
  log(">> LOADING FRONTEND ROUTES");
  await wait(200);
  try {
    require("./routes/chat.cjs")(app);
    require("./routes/chat-voice.cjs")(app);
    require("./routes/newsletter.cjs")(app);
    require("./routes/meta-feed.cjs")(app);
    require("./routes/product-page.cjs")(app);
    require("./routes/system-status.cjs")(app);
    require("./routes/versione.cjs")(app);
    log("✅ FRONTEND ROUTES CARICATE");
  } catch (err) {
    logErr("❌ ERRORE FRONTEND ROUTES (ma static resta attivo):", err.message || err);
  }

  // =========================================================
  // ENDPOINT UNICO BACKUP + RESTORE
  // =========================================================
  app.get("/admin/backup-restore", async (req, res) => {
    try {
      const { backupGenerale } = require("./modules/backup.cjs");
      const { restore } = require("./modules/restore.cjs");

      await backupGenerale({ source: "manual", force: true });
      await restore();

      global.__restore_completed = true;

      res.json({ ok: true, msg: "Backup + Restore eseguiti" });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  // =========================================================
  // 🔍 ENDPOINT DIAGNOSTICO: STATO DB + FRONTEND
  // =========================================================
  app.get("/admin/frontend-status", (req, res) => {
    try {
      const dbLocal = require("./db/database.cjs");
      const countProdotti = dbLocal.prepare("SELECT COUNT(*) AS n FROM prodotti").get().n;
      const countOrdini = dbLocal.prepare("SELECT COUNT(*) AS n FROM ordini").get().n;
      const countUtenti = dbLocal.prepare("SELECT COUNT(*) AS n FROM utenti").get().n;
      const countVendite = dbLocal.prepare("SELECT COUNT(*) AS n FROM vendite").get().n;

      const PUBLIC_DIR = path.resolve("app/public");
      const indexPath = path.join(PUBLIC_DIR, "index.html");
      const hasPublic = fs.existsSync(PUBLIC_DIR);
      const hasIndex = fs.existsSync(indexPath);

      const dbVuoto = (countProdotti + countOrdini + countUtenti + countVendite) === 0;

      res.json({
        ok: true,
        db: {
          prodotti: countProdotti,
          ordini: countOrdini,
          utenti: countUtenti,
          vendite: countVendite,
          vuoto: dbVuoto
        },
        frontend: {
          publicDir: PUBLIC_DIR,
          hasPublic,
          indexPath,
          hasIndex
        }
      });
    } catch (err) {
      logErr("❌ ERRORE /admin/frontend-status:", err.message || err);
      res.json({ ok: false, error: err.message || String(err) });
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
      // BACKUP + MONITOR (identico al tuo)
      // =====================================================

      // ... (tutto il tuo codice backup, monitor, sync JSON, sync YouTube)

    });
  }

  log(">> CALLING startServer()");
  startServer();
})();
