/* FILE: app/server/server.cjs */
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const fs = require("fs");

const app = express();
app.disable("x-powered-by");

const log = (msg, ...args) => console.log(`\x1b[36m[${new Date().toISOString()}]\x1b[0m ${msg}`, ...args);

// PATCH ROOT-FINDER
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

(async () => {
  app.use(express.json());
  app.use(cookieParser());

  // 1. Database
  const db = require("./db/database.cjs");
  app.set("db", db);

  // 2. Middleware di contesto
  require("./middleware/context.cjs")(app);

  // 3. 🚀 ROTTE API (Senza ambiguità)
  const router = require("./router.cjs");
  app.use("/api", router); // Gestisce /api/utenti, /api/auth, ecc.

  // ⭐ FORCE ADMIN ROUTE: Montaggio diretto per evitare blocchi del router.cjs
  const adminDashboard = require("./routes/admin-dashboard.cjs");
  app.use("/api/admin", adminDashboard); // La Dashboard risponderà a /api/admin/dashboard

  const rimborsiRouter = require("./routes/rimborso.cjs");
  app.use("/api/rimborso", rimborsiRouter); // I rimborsi risponderanno a /api/rimborso/...

  // 4. Statici
  const PUBLIC_DIR = path.resolve("app/public");
  app.use(express.static(PUBLIC_DIR));
  app.use("/admin", express.static(path.join(PUBLIC_DIR, "admin")));

  app.get("/admin/login", (req, res) => {
    res.sendFile(path.join(PUBLIC_DIR, "admin/admin-login.html"));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => log(`🎉 SERVER OPERATIVO SULLA PORTA ${PORT}`));
})();
