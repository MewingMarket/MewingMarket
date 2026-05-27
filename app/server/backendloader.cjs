// =========================================================
// BACKENDLOADER — attacca solo il backend, lazy-friendly
// =========================================================

const path = require("path");
const cookieParser = require("cookie-parser");

function log(...a){ console.log("[BACKEND]", ...a); }
function logErr(...a){ console.error("[BACKEND-ERR]", ...a); }

module.exports = async function backendloader(app) {
  log(">> BOOT: logging.cjs");
  try {
    require("./services/logging.cjs");
  } catch(e){
    logErr("logging.cjs:", e.message);
  }

  try {
    require("./services/diagnostica-lite.cjs");
  } catch(e){}

  log(">> BOOT: restore");
  try {
    const { restore } = require("./modules/restore.cjs");
    await restore();
  } catch(e){
    logErr("restore:", e.message);
  }

  log(">> BOOT: parser middleware");
  app.use(cookieParser());

  log(">> BOOT: universal-json");
  try {
    const fs = require("fs");
    const persistDir = "/var/data/json";
    fs.mkdirSync(persistDir, { recursive: true });
    console.log("🟩 [BOOT] Cartella persistente OK:", persistDir);
  } catch (e) {
    console.error("🟥 [BOOT] Errore creazione /var/data/json:", e.message);
  }

  try {
    const uj = require("./middleware/universal-json.cjs");
    app.use(uj);
  } catch(e){ logErr("universal-json:", e.message); }

  log(">> BOOT: api-guard");
  try {
    const apiGuard = require("./middleware/api-guard.cjs");
    app.use("/api", apiGuard);
  } catch (e) {
    logErr("api-guard:", e.message);
  }

  log(">> BOOT: database");
  let db = null;
  try { db = require("./db/database.cjs"); }
  catch(e){ logErr("DB load:", e.message); }

  if(!db){
    logErr("DB non disponibile — SAFE MODE statico");
    return;
  }

  app.set("db", db);

  log(">> BOOT: cache");
  try { require("./middleware/cache.cjs")(app); } catch(e){}

  log(">> BOOT: uploads");
  try { require("./middleware/uploads.cjs")(app); } catch(e){}

  log(">> BOOT: context");
  try { require("./middleware/context.cjs")(app); } catch(e){}

  log("🟧 introspect DISATTIVATO");
  log("🟧 diagnostica DISATTIVATA");
  log("🟧 rewriteScripts DISATTIVATO");

  log(">> BOOT: router API (universale LAZY)");
  try {
    const router = require("./router.cjs");
    app.use("/api", router);
  } catch(e){ logErr("router:", e); }

  log("🟧 cron-auto-opt NON avviato automaticamente");
  log("🟧 cron-youtube NON avviato automaticamente");
  log("🟧 cron-sync NON avviato automaticamente");
  log("🟧 cold-start e bootstrap SOLO on-demand");

  log("🟩 BACKEND CARICATO (backendloader completato)");
};
