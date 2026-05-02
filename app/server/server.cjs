/* =========================================================
 * SERVER — SAFE MODE FINAL (2027.980) — PATCH 2027.981
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
 * 0) /api/ping SEMPRE PRIMA
 * =========================================================
 */
app.get("/api/ping", (req,res)=>res.json({ok:true,ts:Date.now()}));

/* =========================================================
 * 1) LISTEN SUBITO (Render richiede porta aperta)
 * =========================================================
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  log(`🎉 SERVER LISTENING on ${PORT} (SAFE MODE)`);
  bootInBackground();
});

/* =========================================================
 * 2) BOOT COMPLETO IN BACKGROUND
 * =========================================================
 */
async function bootInBackground(){

  try {
    log(">> BOOT: logging.cjs");
    require("./services/logging.cjs");

    log(">> BOOT: restore");
    const { restore } = require("./modules/restore.cjs");
    await restore();

    log(">> BOOT: parser middleware");
    app.use(express.json());
    app.use(cookieParser());

    log(">> BOOT: universal-json");
    try {
      const uj = require("./middleware/universal-json.cjs");
      app.use(uj);
    } catch(e){ logErr("universal-json:", e.message); }

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

    /* =========================================================
     * 🔥 PATCH CRITICA 2027.981
     * Router API PRIMA delle statiche
     * =========================================================
     */
    log(">> BOOT: router API");
    try {
      const router = require("./router.cjs");
      app.use("/api", router);
    } catch(e){ logErr("router:", e); }

    /* =========================================================
     * STATICHE DOPO IL ROUTER (PATCH)
     * =========================================================
     */
    const PUBLIC_DIR = path.resolve("app/public");
    app.use(express.static(PUBLIC_DIR));
    app.use("/admin", express.static(path.resolve("app/public/admin")));
    app.get("/admin/login",(req,res)=>res.sendFile(path.resolve("app/public/admin/admin-login.html")));

    /* =========================================================
     * FIX JS STATIC (Render)
     * =========================================================
     */
    const PUBLIC_JS = path.join(__dirname, "../public");
    app.use((req,res,next)=>{
      if(!req.path.endsWith(".js") && !req.url.includes(".js?")) return next();
      const clean = req.path.split("?")[0];
      const file = path.join(PUBLIC_JS, path.basename(clean));
      if(fs.existsSync(file)){
        res.setHeader("Content-Type","application/javascript; charset=utf-8");
        res.setHeader("X-Content-Type-Options","nosniff");
        return res.sendFile(file);
      }
      next();
    });

    /* =========================================================
     * COLD START + BOOTSTRAP
     * =========================================================
     */
    log(">> BOOT: cold-start");
    try {
      const cold = require("./startup/cold-start.cjs");
      cold(app);
    } catch(e){ logErr("cold-start:", e.message); }

    log(">> BOOT: bootstrap");
    try {
      await require("./startup/bootstrap.cjs")();
      log("BOOTSTRAP OK");
    } catch(e){ logErr("bootstrap:", e); }

    log("🟧 cron-youtube DISATTIVATO");

  } catch(err){
    logErr("BOOT ERROR:", err);
  }
}

/* =========================================================
 * 3) /data persistente
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
