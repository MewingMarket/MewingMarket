/* =========================================================
   Entry point del server — VERSIONE INTEGRALE + ADMIN PATCH
   ========================================================= */

process.on("uncaughtException", err => console.error("🔥 UNCAUGHT EXCEPTION:", err));
process.on("unhandledRejection", err => console.error("🔥 UNHANDLED REJECTION:", err));

const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

const log = (msg, ...args) => console.log(`\x1b[36m[${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);
const logErr = (msg, ...args) => console.error(`\x1b[31m[${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);

// 🟩 PATCH ROOT-FINDER (Risolve il problema dei file JS non trovati su Render)
app.use((req, res, next) => {
  if (req.path.endsWith(".js") || req.url.includes(".js?")) {
    const cleanName = path.basename(req.path.split('?')[0]);
    const pathsToTry = [
      path.join(process.cwd(), "app/public/js", cleanName),
      path.join(process.cwd(), "app/public/admin/js", cleanName),
      path.join(process.cwd(), "app/public", cleanName)
    ];
    for (let p of pathsToTry) {
      if (fs.existsSync(p)) {
        res.setHeader("Content-Type", "application/javascript; charset=utf-8");
        return res.sendFile(p);
      }
    }
  }
  next();
});

const PUBLIC_DIR = path.resolve("app/public");

(async () => {
  app.use(express.json());
  app.use(cookieParser());

  // 1. Database
  let db;
  try {
    db = require("./db/database.cjs");
    app.set("db", db);
    log("✅ DATABASE CARICATO");
  } catch (err) {
    logErr("❌ ERRORE DATABASE:", err.message);
  }

  // 2. Middleware (Tutti i tuoi originali)
  try {
    require("./middleware/cache.cjs")(app);
    require("./middleware/uploads.cjs")(app);
    require("./middleware/context.cjs")(app);
    log("✅ MIDDLEWARE CARICATI");
  } catch (err) {
    logErr("⚠️ ERRORE MIDDLEWARE:", err.message);
  }

  // 3. 🚀 ROTTE API & ADMIN (Struttura Rinforzata)
  try {
    const router = require("./router.cjs");
    app.use("/api", router); // Rotte standard: auth, utenti, ecc.

    // PATCH: Montaggio esplicito dashboard e rimborsi per evitare conflitti
    const adminDashboard = require("./routes/admin-dashboard.cjs");
    app.use("/api/admin", adminDashboard); 
    
    const rimborsiRouter = require("./routes/rimborso.cjs");
    app.use("/api/rimborso", rimborsiRouter);

    log("✅ ROTTE API E DASHBOARD AGGANCIATE (/api/admin/dashboard)");
  } catch (err) {
    logErr("❌ ERRORE ROTTE:", err.message);
  }

  // 4. Gestione Statici
  app.use(express.static(PUBLIC_DIR));
  app.use("/admin", express.static(path.join(PUBLIC_DIR, "admin")));

  // 5. Rotte Frontend / Pagine Speciali
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin/admin-login.html"));
  });

  try {
    require("./routes/product-page.cjs")(app);
    require("./routes/system-status.cjs")(app);
    require("./routes/versione.cjs")(app);
  } catch (e) {}

  // 6. Avvio
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => log(`🎉 SERVER LISTENING ON PORT ${PORT}`));
})();
