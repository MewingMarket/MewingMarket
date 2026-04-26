/* FILE: app/server/server.cjs */
/**
 * =========================================================
 * Entry point del server — VERSIONE CORRETTA DASHBOARD
 * Fix: Prefissi rotte, caricamento moduli e gestione statici
 * =========================================================
 */

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

log(">> SERVER STARTING…");

// 🟩 PATCH ROOT-FINDER (Trova i file JS ovunque siano in public)
app.use((req, res, next) => {
  if (req.path.endsWith(".js") || req.url.includes(".js?")) {
    const cleanName = path.basename(req.path.split('?')[0]);
    const pathsToTry = [
      path.join(process.cwd(), "app/public", cleanName),
      path.join(process.cwd(), "app/public/js", cleanName),
      path.join(process.cwd(), "app/public", req.path.split('?')[0])
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

// 🔵 LOGGER GLOBALE RICHIESTE
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    log(`${req.method} ${req.url} ${res.statusCode} - ${Date.now() - start}ms`);
  });
  next();
});

(async () => {
  // 1. Inizializzazione Ambiente e DB
  app.use(express.json());
  app.use(cookieParser());

  let db;
  try {
    db = require("./db/database.cjs");
    app.set("db", db);
    log("✅ DATABASE CARICATO");
  } catch (err) {
    logErr("❌ ERRORE DATABASE:", err.message);
  }

  // 2. Caricamento Middleware
  try {
    require("./middleware/cache.cjs")(app);
    require("./middleware/uploads.cjs")(app);
    require("./middleware/context.cjs")(app);
    log("✅ MIDDLEWARE CARICATI");
  } catch (err) {
    logErr("⚠️ ERRORE CARICAMENTO MIDDLEWARE:", err.message);
  }

  // 3. 🚀 ROTTE API (Gestione Prefissi)
  try {
    const router = require("./router.cjs");
    
    // Supporto sia per chiamate con /api che senza (per compatibilità frontend)
    app.use("/api", router); 
    
    // ⭐ FIX DASHBOARD: Se il JS chiama /admin/dashboard, questo lo cattura
    const adminDashboard = require("./routes/admin-dashboard.cjs");
    app.use("/admin", adminDashboard);
    
    // Rotta rimborsi
    const rimborsiRouter = require("./routes/rimborso.cjs");
    app.use("/rimborso", rimborsiRouter);

    log("✅ ROTTE API E DASHBOARD AGGANCIATE");
  } catch (err) {
    logErr("❌ ERRORE CARICAMENTO ROTTE:", err.message);
  }

  // 4. Gestione File Statici e Frontend
  app.use(express.static(PUBLIC_DIR));

  app.get("/admin/login", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin/admin-login.html"));
  });

  // Serve la cartella admin statica
  app.use("/admin", express.static(path.join(PUBLIC_DIR, "admin")));

  // 5. Altre rotte Transazionali/Frontend
  try {
    require("./routes/product-page.cjs")(app);
    require("./routes/system-status.cjs")(app);
    require("./routes/versione.cjs")(app);
  } catch (e) {}

  // 6. Avvio Server
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    log(`🎉 SERVER LISTENING ON PORT ${PORT}`);
  });
})();
