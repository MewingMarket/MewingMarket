/* =========================================================
 * SERVER — HARDENED MODE (2050.901)
 * Anti‑PHP, Anti‑Bot, Anti‑OOM, Anti‑Scanner + API-GUARD
 * =========================================================
 */

process.on("uncaughtException", err => console.error("🔥 UNCAUGHT:", err));
process.on("unhandledRejection", err => console.error("🔥 UNHANDLED:", err));

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

function log(...a){ console.log("[LOG]", ...a); }
function logErr(...a){ console.error("[ERR]", ...a); }

/* =========================================================
 * 🛡️ 1) ANTI‑PHP + ANTI‑SCANNER + ANTI‑WORDPRESS
 * =========================================================
 */

const BLOCK_PATTERNS = [
  /\.php$/i,
  /wp-/i,
  /xmlrpc/i,
  /joomla/i,
  /drupal/i,
  /cms/i,
  /vendor/i,
  /composer/i,
  /autoload/i,
  /eval/i,
  /base64/i,
  /shell/i,
  /cmd/i,
  /adminer/i,
  /phpmyadmin/i,
  /sql/i
];

app.use((req, res, next) => {
  const url = req.url.toLowerCase();

  if (BLOCK_PATTERNS.some(p => p.test(url))) {
    console.warn("🛑 BLOCCATO (pattern):", url);
    return res.status(404).send("Not found");
  }

  next();
});

/* =========================================================
 * 🛡️ 2) ANTI‑HEAD / ANTI‑OPTIONS
 * =========================================================
 */
app.use((req, res, next) => {
  if (req.method === "HEAD" || req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

/* =========================================================
 * 🛡️ 3) ANTI‑OOM — limite dimensione body
 * =========================================================
 */
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: false, limit: "200kb" }));

/* =========================================================
 * FIX 2055 — Servizio JS deterministico (UNICO BLOCCO)
 * ========================================================= */
app.use((req, res, next) => {
  if (!req.path.match(/\.js($|\?)/)) return next();

  const clean = req.path.split("?")[0];
  const rel = clean.replace(/^\//, "");
  const fullPath = path.join(process.cwd(), "app/public", rel);

  if (fs.existsSync(fullPath)) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    console.log("🟩 [JS] Caricato:", rel);
    return res.sendFile(fullPath);
  }

  console.warn("🟨 [JS] NON TROVATO:", rel);

  // Risposta JS-safe (mai HTML)
  res.status(404);
  res.setHeader("Content-Type","application/javascript; charset=utf-8");
  res.setHeader("X-Content-Type-Options","nosniff");
  return res.send(`// 404 JS not found: ${rel}\n`);
});

/* =========================================================
 * /api/ping + diagnostica lite
 * =========================================================
 */
app.get("/api/ping", (req,res)=>{
  try {
    const diag = require("./services/diagnostica-lite.cjs");
    diag.logPing();
  } catch(e){}
  res.json({ok:true,ts:Date.now()});
});

/* =========================================================
 * LISTEN SUBITO (Render richiede porta aperta)
 * =========================================================
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  log(`🎉 SERVER LISTENING on ${PORT} (HARDENED MODE)`);
  bootInBackground();
});

/* =========================================================
 * BOOT COMPLETO IN BACKGROUND
 * =========================================================
 */
async function bootInBackground(){

  try {
    log(">> BOOT: logging.cjs");
    require("./services/logging.cjs");

    const diag = require("./services/diagnostica-lite.cjs");

    log(">> BOOT: restore");
    const { restore } = require("./modules/restore.cjs");
    await restore();

    log(">> BOOT: parser middleware");
    app.use(cookieParser());

    /* =========================================================
     * UNIVERSAL JSON
     * =========================================================
     */
    log(">> BOOT: universal-json");
    try {
      const uj = require("./middleware/universal-json.cjs");
      app.use(uj);
    } catch(e){ logErr("universal-json:", e.message); }

    /* =========================================================
     * API GUARD — unico scudo per tutte le /api
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
     * ROUTER UNIVERSALE 2051 (AGGRESSIVE)
     * =========================================================
     */
    log(">> BOOT: router API (universale)");
    try {
      const router = require("./router.cjs");
      app.use("/api", router);
    } catch(e){ logErr("router:", e); }

    /* =========================================================
     * STATICHE
     * =========================================================
     */
    const PUBLIC_DIR = path.resolve("app/public");
    app.use(express.static(PUBLIC_DIR));
    app.use("/admin", express.static(path.resolve("app/public/admin")));

    app.get("/admin/login", (req, res) => {
      res.sendFile(path.resolve("app/public/login.html"));
    });

    log(">> BOOT: cold-start DISATTIVATO (SAFE MODE)");
    log(">> BOOT: bootstrap DISATTIVATO (SAFE MODE)");
    log("🟧 cron-youtube DISATTIVATO");

  } catch(err){
    logErr("BOOT ERROR:", err);
  }
}

/* =========================================================
 * /data persistente
 * =========================================================
 */
const DATA_BACKUP = path.join(process.cwd(), "app/data");
const DATA_PERSIST = "/var/data/json";

if(!fs.existsSync(DATA_BACKUP)) fs.mkdirSync(DATA_BACKUP,{recursive:true});

app.use("/data",(req,res)=>{
  const rel = req.path.replace(/^\/+/,"");
  const backup = path.join(DATA_BACKUP, rel);
  const persist = path.join(DATA_PERSIST, rel);

  if(fs.existsSync(persist)){
    try {
      const buf = fs.readFileSync(persist);
      fs.writeFileSync(backup, buf);
      return res.sendFile(persist);
    } catch(e){ logErr("data persist:", e.message); }
  }

  if(fs.existsSync(backup)) return res.sendFile(backup);

  res.status(404).json({error:"File non trovato"});
});
