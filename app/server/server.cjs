/* =========================================================
 * Entry point del server — SAFE MODE (2027.952‑SM)
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

log(">> SERVER STARTING (SAFE MODE)…");

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

/* =========================================================
 * JS STATIC FIX — VERSIONE COMPATIBILE RENDER
 * =========================================================
 */
const PUBLIC_JS = path.join(__dirname, "../public");

app.use((req, res, next) => {
  if (!req.path.endsWith(".js") && !req.url.includes(".js?")) {
    return next();
  }

  const clean = req.path.split("?")[0];
  const filePath = path.join(PUBLIC_JS, path.basename(clean));

  if (fs.existsSync(filePath)) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    return res.sendFile(filePath);
  }

  next();
});

const ROOT = path.resolve("app");
log(">> ROOT PATH:", ROOT);

if (global.__server_started) {
  logErr("⚠️ SERVER GIÀ AVVIATO — istanza duplicata evitata");
  return;
}
global.__server_started = true;

let BOOTSTRAP_OK = false;

/* =========================================================
 * DEBUG REQUEST/RESPONSE
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

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/* =========================================================
 * BOOT SEQUENZA
 * =========================================================
 */
(async () => {
  log(">> LOADING logging.cjs");
  await wait(200);
  require("./services/logging.cjs");

  log(">> RESTORE DB & FILES");
  await wait(200);
  const { restore } = require("./modules/restore.cjs");
  await restore();
  global.__restore_completed = true;

  log(">> APPLYING PARSER MIDDLEWARE");
  await wait(200);
  app.use(express.json());
  app.use(cookieParser());

  // 🔵 UNIVERSAL JSON (manteniamo)
  try {
    const universalJson = require("./middleware/universal-json.cjs");
    app.use(universalJson);
    log("🟩 universal-json.cjs attivato");
  } catch (err) {
    logErr("⚠️ universal-json.cjs non trovato:", err.message);
  }

  let db;
  try {
    db = require("./db/database.cjs");
  } catch (err) {
    logErr("❌ Errore caricamento database.cjs:", err.message);
  }

  if (!db) {
    logErr("❌ ERRORE FATALE: DB null dopo restore");
    process.exit(1);
  }

  app.set("db", db);
  log(">> DB REGISTRATO");

  log(">> LOADING cache.cjs");
  await wait(200);
  require("./middleware/cache.cjs")(app);

  log(">> LOADING uploads.cjs");
  await wait(200);
  require("./middleware/uploads.cjs")(app);

  log(">> LOADING context.cjs");
  await wait(200);
  require("./middleware/context.cjs")(app);

  /* =========================================================
   * INTROSPECT (DISATTIVATO IN SAFE MODE)
   * =========================================================
   */
  log("🟧 introspect.cjs DISATTIVATO (SAFE MODE)");

  /* =========================================================
   * ROUTER API (ATTIVO)
   * =========================================================
   */
  log(">> LOADING router.cjs");
  await wait(200);
  try {
    const router = require("./router.cjs");
    app.use("/api", router);
    log(">> ROUTER API CARICATO");
  } catch (err) {
    console.error("❌ ROUTER LOAD ERROR:", err);
  }

  /* =========================================================
   * COLD START (ATTIVO)
   * =========================================================
   */
  try {
    const coldStart = require("./startup/cold-start.cjs");
    coldStart(app);
    log("❄️  Cold-start avviato");
  } catch (err) {
    logErr("❌ Errore cold-start:", err.message);
  }

  /* =========================================================
   * MIDDLEWARE DIAGNOSTICO (DISATTIVATO)
   * =========================================================
   */
  log("🟧 middleware-diagnostico.cjs DISATTIVATO (SAFE MODE)");

  /* =========================================================
   * STATIC ROUTES
   * =========================================================
   */
  log(">> REGISTER STATIC ROUTES");
  await wait(200);

  const PUBLIC_DIR = path.resolve("app/public");

  app.get("/", (req, res, next) => {
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");
    next();
  });

  app.use(express.static(PUBLIC_DIR));

  /* =========================================================
   * DIAGNOSTICA ENDPOINTS (DISATTIVATO)
   * =========================================================
   */
  log("🟧 diagnostica-endpoints DISATTIVATO (SAFE MODE)");

  /* =========================================================
   * DIAGNOSTICA CSS (DISATTIVATO)
   * =========================================================
   */
  log("🟧 diagnostica-css DISATTIVATO (SAFE MODE)");

  /* =========================================================
   * REWRITE SCRIPTS (DISATTIVATO)
   * =========================================================
   */
  log("🟧 rewriteScripts.cjs DISATTIVATO (SAFE MODE)");

  app.use("/*.css", express.static(PUBLIC_DIR));
  app.use("/css", express.static(PUBLIC_DIR));

  /* =========================================================
   * /data (persistente)
   * =========================================================
   */
  const DATA_BACKUP = path.join(process.cwd(), "app/data");
  const DATA_PERSIST = "/var/data/json";

  if (!fs.existsSync(DATA_BACKUP)) {
    fs.mkdirSync(DATA_BACKUP, { recursive: true });
    log("📁 [DATA] Creata cartella app/data");
  }

  app.use("/data", (req, res) => {
    const rel = req.path.replace(/^\/+/, "");
    const backupPath  = path.join(DATA_BACKUP, rel);
    const persistPath = path.join(DATA_PERSIST, rel);

    if (fs.existsSync(persistPath)) {
      try {
        const buf = fs.readFileSync(persistPath);
        fs.writeFileSync(backupPath, buf);
        return res.sendFile(persistPath);
      } catch (e) {
        logErr(`❌ Errore lettura persistente: ${e.message}`);
      }
    }

    if (fs.existsSync(backupPath)) {
      return res.sendFile(backupPath);
    }

    res.status(404).json({ error: "File non trovato" });
  });

  /* =========================================================
   * ROUTES EXPRESS CHE DEVONO RESTARE (solo admin)
   * =========================================================
   */
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  /* =========================================================
   * START SERVER
   * =========================================================
   */
  async function startServer() {
    try {
      await require("./startup/bootstrap.cjs")();
      BOOTSTRAP_OK = true;
    } catch (err) {
      logErr("❌ BOOTSTRAP ERROR:", err);
    }

    const PORT = process.env.PORT || 3000;

    try {
      require("./startup/cron-youtube.cjs")();
    } catch (e) {
      logErr("⚠️ cron-youtube non avviato");
    }

    app.listen(PORT, () => {
      log(`🎉 SERVER LISTENING ON PORT ${PORT} (SAFE MODE)`);
    });
  }

  startServer();
})();
