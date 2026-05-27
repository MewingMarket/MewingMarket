// =========================================================
// BACKENDLOADER — attacca solo il backend, lazy-friendly
// - DB
// - cache / uploads / context
// - universal-json
// - api-guard
// - router universale LAZY
// - nessun cron auto-avviato
// - nessun cold-start pesante
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

  // diagnostica-lite è leggera
  try {
    require("./services/diagnostica-lite.cjs");
  } catch(e){}

  // restore (già usato prima, lo teniamo)
  log(">> BOOT: restore");
  try {
    const { restore } = require("./modules/restore.cjs");
    await restore();
  } catch(e){
    logErr("restore:", e.message);
  }

  log(">> BOOT: parser middleware");
  app.use(cookieParser());

  /* =========================================================
   * UNIVERSAL JSON + cartella persistente
   * =========================================================
   */
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

  /* =========================================================
   * API GUARD — scudo per tutte le /api
   * =========================================================
   */
  log(">> BOOT: api-guard");
  try {
    const apiGuard = require("./middleware/api-guard.cjs");
    app.use("/api", apiGuard);
  } catch (e) {
    logErr("api-guard:", e.message);
  }

  /* =========================================================
   * DATABASE
   * =========================================================
   */
  log(">> BOOT: database");
  let db = null;
  try { db = require("./db/database.cjs"); }
  catch(e){ logErr("DB load:", e.message); }

  if(!db){
    logErr("DB non disponibile — SAFE MODE statico");
    return;
  }

  app.set("db", db);

  /* =========================================================
   * CACHE / UPLOADS / CONTEXT
   * =========================================================
   */
  log(">> BOOT: cache");
  try { require("./middleware/cache.cjs")(app); } catch(e){}

  log(">> BOOT: uploads");
  try { require("./middleware/uploads.cjs")(app); } catch(e){}

  log(">> BOOT: context");
  try { require("./middleware/context.cjs")(app); } catch(e){}

  log("🟧 introspect DISATTIVATO");
  log("🟧 diagnostica DISATTIVATA");
  log("🟧 rewriteScripts DISATTIVATO");

  /* =========================================================
   * ROUTER UNIVERSALE (versione LAZY 2060)
   * =========================================================
   */
  log(">> BOOT: router API (universale LAZY)");
  try {
    const router = require("./router.cjs"); // router.cjs aggiornato alla versione lazy che ti ho scritto
    app.use("/api", router);
  } catch(e){ logErr("router:", e); }

  /* =========================================================
   * CRON / BOOTSTRAP / COLD-START — SOLO ON-DEMAND
   * (non avviamo nulla qui per evitare OOM)
   * =========================================================
   */
  log("🟧 cron-auto-opt NON avviato automaticamente");
  log("🟧 cron-youtube NON avviato automaticamente");
  log("🟧 cron-sync NON avviato automaticamente");
  log("🟧 cold-start e bootstrap SOLO on-demand");
};
