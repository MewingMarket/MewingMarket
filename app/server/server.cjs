/* FILE: app/server/server.cjs */
/**
 * =========================================================
 * Entry point del server — versione DEFINITIVA
 * Patch 2026 — Restore PRIMA del database + Backup intelligente
 * Patch 2026.600 — Anti-crash router + Monitor DB/Frontend
 * Patch 2026.700 — No-cache index.html (anti-CDN)
 * Patch 2026.900 — Debug richieste + Hook diagnostica.cjs
 * Patch 2026.960 — Router FULL ERROR LOG
 * Patch 2026.970 — Middleware Diagnostico Route Scanner
 * Patch 2026.999 — Cold-start Render (warmup non bloccante)
 * Patch 2026.9999 — DISATTIVATO debug-db (fix API protette)
 * Patch 2027.DATA — /data doppia sorgente + backup + log
 * Patch 2027.CSS  — CSS globali per header/footer
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

/**
 * =========================================================
 * HEALTH BASE
 * =========================================================
 */
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    bootstrap: BOOTSTRAP_OK,
    time: new Date().toISOString()
  });
});

/**
 * =========================================================
 * 🔵 DEBUG REQUEST/RESPONSE — logger globale
 * =========================================================
 */
app.use((req, res, next) => {
  const start = Date.now();
  console.log("➡️  REQ:", req.method, req.url);

  res.on("finish", () => {
    const ms = Date.now() - start;
    console.log("⬅️  RES:", req.method, req.url, res.statusCode, ms + "ms");
  });

  next();
});

/**
 * =========================================================
 * 🔍 HOOK DIAGNOSTICA (server-level)
 * =========================================================
 */
try {
  const diagnostica = require("./diagnostica.cjs");
  if (typeof diagnostica?.hookServer === "function") {
    diagnostica.hookServer(app, { log, logErr });
    log("🟩 diagnostica.cjs agganciata a livello server");
  } else {
    log("🟨 diagnostica.cjs presente ma senza hookServer()");
  }
} catch (err) {
  log("🟧 diagnostica.cjs non presente (ok per ora):", err.message);
}

const wait = (ms) => new Promise(res => res(ms));

(async () => {
  log(">> LOADING logging.cjs");
  await wait(200);
  require("./services/logging.cjs");

  // =========================================================
  // 🔥 RESTORE PRIMA DEL DATABASE
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
  // 🔥 ROUTER API — PATCH: FULL ERROR LOG
  // =========================================================
  log(">> LOADING router.cjs");
  await wait(200);
  try {
    console.log("LOADING ROUTER PATH:", path.resolve("app/server/router.cjs"));
    const router = require("./router.cjs");
    app.use("/api", router);
    log(">> ROUTER API CARICATO");
  } catch (err) {
    console.error("❌ ROUTER LOAD ERROR FULL:", err);
    throw err;
  }

  // =========================================================
  // ❄️  COLD START (warmup Render, non blocca nulla)
  // =========================================================
  try {
    const coldStart = require("./startup/cold-start.cjs");
    coldStart(app);
    log("❄️  Cold-start avviato");
  } catch (err) {
    logErr("❌ Errore cold-start:", err.message);
  }

  // =========================================================
  // ⭐ PATCH: MIDDLEWARE DIAGNOSTICO ROUTES
  // =========================================================
  try {
    require("./middleware/middleware-diagnostico.cjs")(app);
    console.log("🟩 Middleware diagnostico attivato");
  } catch (err) {
    console.error("❌ ERRORE middleware diagnostico:", err);
  }

  // =========================================================
  // STATIC ROUTES + NO-CACHE INDEX.HTML
  // =========================================================
  log(">> REGISTER STATIC ROUTES");
  await wait(200);

  const PUBLIC_DIR = path.resolve("app/public");

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

  app.get("/", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  // Statico principale
  app.use(express.static(PUBLIC_DIR));

  // =========================================================
  // PATCH 2027.CSS — CSS GLOBALI
  // =========================================================
  app.use("/*.css", express.static(PUBLIC_DIR));
  app.use("/css", express.static(PUBLIC_DIR));

  // =========================================================
  // PATCH 2027.DATA — doppia sorgente + backup + log
  // =========================================================
  const DATA_PUBLIC = path.join(process.cwd(), "app/public/data");
  const DATA_BACKUP = path.join(process.cwd(), "app/data");
  const DATA_PERSIST = "/var/data/json";

  [DATA_PUBLIC, DATA_BACKUP].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log("📁 [DATA] Creata cartella:", dir);
    }
  });

  app.use("/data", (req, res) => {
    const rel = req.path.replace(/^\/+/, "");
    const publicPath = path.join(DATA_PUBLIC, rel);
    const backupPath = path.join(DATA_BACKUP, rel);
    const persistPath = path.join(DATA_PERSIST, rel);

    // 1) Se esiste in app/public/data → serve quello
    if (fs.existsSync(publicPath)) {
      log(`🟦 [DATA] public → ${rel}`);
      return res.sendFile(publicPath);
    }

    // 2) Se esiste in /var/data/json → serve quello + backup
    if (fs.existsSync(persistPath)) {
      log(`🟩 [DATA] persist → ${rel}`);

      try {
        const buf = fs.readFileSync(persistPath);

        try {
          fs.writeFileSync(publicPath, buf);
          log(`📁 [DATA] backup app/public/data → ${rel}`);
        } catch (e) {
          logErr("❌ Errore copia public:", e.message);
        }

        try {
          fs.writeFileSync(backupPath, buf);
          log(`📁 [DATA] backup app/data → ${rel}`);
        } catch (e) {
          logErr("❌ Errore copia app/data:", e.message);
        }

      } catch (e) {
        logErr("❌ Errore lettura persistente:", e.message);
      }

      return res.sendFile(persistPath);
    }

    // 3) Nessuno dei due → 404
    logErr(`❌ [DATA] file non trovato: ${rel}`);
    res.status(404).json({ error: "File non trovato" });
  });

  // =========================================================
  // SPA FALLBACK
  // =========================================================
  app.get("*", (req, res, next) => {
    if (req.url.startsWith("/api")) return next();
    if (req.url.startsWith("/admin")) return next();
    if (req.url.includes(".") && !req.url.endsWith(".html")) return next();
    res.sendFile(path.join(PUBLIC_DIR, "index.html"));
  });

  // =========================================================
  // ADMIN STATIC
  // =========================================================
  log(">> REGISTER ADMIN ROUTES");
  await wait(200);
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  // =========================================================
  // FRONTEND ROUTES
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
    require("./routes/versione.cjs")(app);require("./routes/var-data.cjs")(app);
    log("✅ FRONTEND ROUTES CARICATE");
  } catch (err) {
    logErr("❌ ERRORE FRONTEND ROUTES:", err.message || err);
  }

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
    });
  }

  log(">> CALLING startServer()");
  startServer();
})();
