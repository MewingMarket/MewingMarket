/* =========================================================
 * SERVER — SAFE MODE FINAL (2038.002)
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
 * ❌ PATCH OPZIONE 1 — RIMOSSO app.head("*")
 * (Render non lo richiede più e interferiva con i .js)
 * ========================================================= */

/* =========================================================
 * /api/ping + diagnostica lite (ridotta)
 * ========================================================= */
app.get("/api/ping", (req,res)=>{
  try {
    const diag = require("./services/diagnostica-lite.cjs");
    diag.logPing();
  } catch(e){}
  res.json({ok:true,ts:Date.now()});
});

/* =========================================================
 * LISTEN SUBITO (Render richiede porta aperta)
 * ========================================================= */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  log(`🎉 SERVER LISTENING on ${PORT} (SAFE MODE)`);
  bootInBackground();
});

/* =========================================================
 * BOOT COMPLETO IN BACKGROUND
 * ========================================================= */
async function bootInBackground(){

  try {
    log(">> BOOT: logging.cjs");
    require("./services/logging.cjs");

    /* diagnostica lite */
    const diag = require("./services/diagnostica-lite.cjs");

    log(">> BOOT: restore");
    const { restore } = require("./modules/restore.cjs");
    await restore();

    log(">> BOOT: parser middleware");
    app.use(express.json());
    app.use(cookieParser());

    /* =========================================================
     * JS DEBUG — intercetta TUTTI i .js
     * ========================================================= */
    const JS_DEBUG_LOADED = [];
    const JS_DEBUG_ERRORS = [];

    app.use((req, res, next) => {
      if (!req.path.match(/\.js($|\?)/)) return next();

      const clean = req.path.split("?")[0];
      const filename = clean.split("/").pop();
      const fullPath = path.join(process.cwd(), "app/public", clean.replace(/^\//, ""));

      console.log(`🟦 [JS-DEBUG] Richiesto: ${filename}`);
      JS_DEBUG_LOADED.push(filename);

      if (fs.existsSync(fullPath)) {
        try {
          res.setHeader("Content-Type","application/javascript; charset=utf-8");
          res.setHeader("X-Content-Type-Options","nosniff");
          console.log(`🟩 [JS-DEBUG] Caricato: ${filename}`);
          return res.sendFile(fullPath);
        } catch (err) {
          console.error(`❌ [JS-DEBUG] ERRORE in ${filename}:`, err.message);
          JS_DEBUG_ERRORS.push({ file: filename, error: err.message });
          return next();
        }
      }

      console.warn(`🟨 [JS-DEBUG] NON TROVATO: ${filename}`);
      JS_DEBUG_ERRORS.push({ file: filename, error: "File non trovato" });
      next();
    });

    app.get("/api/js-debug-report", (req, res) => {
      res.json({ loaded: JS_DEBUG_LOADED, errors: JS_DEBUG_ERRORS });
    });

    /* =========================================================
     * UNIVERSAL JSON
     * ========================================================= */
    log(">> BOOT: universal-json");
    try {
      const uj = require("./middleware/universal-json.cjs");
      app.use(uj);
    } catch(e){ logErr("universal-json:", e.message); }

    /* =========================================================
     * DATABASE
     * ========================================================= */
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
     * ========================================================= */
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
     * ROUTER UNIVERSALE 2038
     * ========================================================= */
    log(">> BOOT: router API (universale)");
    try {
      const router = require("./router.cjs");
      app.use("/api", router);
    } catch(e){ logErr("router:", e); }

    /* =========================================================
     * STATICHE
     * ========================================================= */
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
 * ========================================================= */
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
