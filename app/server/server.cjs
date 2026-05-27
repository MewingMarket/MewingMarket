// =========================================================
// SERVER — ORCHESTRATORE DUAL-ENTRYPOINT 2060
// - Listen SUBITO (Render-friendly)
// - Boot backend + frontend in background
// - Boot-lock su /api finché il backend non è pronto
// =========================================================

process.on("uncaughtException", err => console.error("🔥 UNCAUGHT:", err));
process.on("unhandledRejection", err => console.error("🔥 UNHANDLED:", err));

const express = require("express");
const path = require("path");
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
 * FIX JS deterministico (UNICO BLOCCO JS)
 * =========================================================
 */
app.use((req, res, next) => {
  if (!req.path.match(/\.js($|\?)/)) return next();

  const clean = req.path.split("?")[0];
  const rel = clean.replace(/^\//, "");
  const fullPath = path.join(process.cwd(), "app/public", rel);

  console.log("🔍 [JS-DEBUG] richiesta JS:", req.path, "→ rel:", rel);

  if (fs.existsSync(fullPath)) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("X-Content-Type-Options", "nosniff");
    console.log("🟩 [JS] Caricato:", rel);
    return res.sendFile(fullPath);
  }

  console.warn("🟨 [JS] NON TROVATO:", rel);

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

/* =========================================================
 * BOOT-LOCK su /api
 * =========================================================
 */
let backendReady = false;

app.use("/api", (req, res, next) => {
  if (!backendReady) {
    return res.status(503).json({ ok:false, error: "BOOTING" });
  }
  next();
});

/* =========================================================
 * LISTEN SUBITO
 * =========================================================
 */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  log(`🎉 SERVER LISTENING on ${PORT} (ORCHESTRATOR 2060)`);
  bootInBackground();
});

/* =========================================================
 * BOOT COMPLETO IN BACKGROUND
 * =========================================================
 */
async function bootInBackground(){
  try {
    const backendLoader = require("./backendloader.cjs");
    await backendLoader(app);

    const loadermaster = require("./loadermaster.cjs");
    await loadermaster(app);

    backendReady = true;
    log("🟩 BACKEND + FRONTEND CARICATI — backendReady = true");

  } catch(err){
    logErr("BOOT ERROR:", err);
  }
}
