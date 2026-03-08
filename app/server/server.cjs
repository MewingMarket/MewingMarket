/**
 * =========================================================
 * File: app/server/server.cjs
 * Entry point del server — versione stabile per Render
 * =========================================================
 */
console.log(">> PACKAGE TYPE:", require("../../package.json").type);
const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.disable("x-powered-by");

// ROOT = /project/src/app
const ROOT = path.resolve("app");

// LOGGING
require("./services/logging.cjs");

// PARSER
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// MIDDLEWARE GLOBALI
require("./middleware/cache.cjs")(app);
require("./middleware/uploads.cjs")(app);
require("./middleware/context.cjs")(app);

/**
 * =========================================================
 * STATICI FRONTEND — SOLO percorsi assoluti
 * =========================================================
 */
app.use(express.static(path.resolve("app/public")));
app.use("/data", express.static(path.resolve("app/data")));

/**
 * =========================================================
 * ADMIN — SOLO percorsi assoluti
 * =========================================================
 */
app.get("/admin/login", (req, res) => {
  res.sendFile(path.resolve("app/public/admin/admin-login.html"));
});

app.use("/admin", express.static(path.resolve("app/public/admin")));

/**
 * =========================================================
 * API
 * =========================================================
 */
const router = require("./router.cjs");
app.use("/api", router);

/**
 * =========================================================
 * ROUTE FRONTEND
 * =========================================================
 */
require("./routes/chat.cjs")(app);
require("./routes/chat-voice.cjs")(app);
require("./routes/newsletter.cjs")(app);
require("./routes/sitemap.cjs")(app);
require("./routes/sales.cjs")(app);
require("./routes/meta-feed.cjs")(app);
require("./routes/product-page.cjs")(app);
require("./routes/system-status.cjs")(app);

/**
 * =========================================================
 * BOOTSTRAP
 * =========================================================
 */
async function startServer() {
  console.log("\n====================================");
  console.log("🚀 Avvio MewingMarket — BOOTSTRAP");
  console.log("====================================\n");

  try {
    await require("./startup/bootstrap.cjs")();
  } catch (err) {
    console.error("❌ Errore bootstrap:", err);
  }

  // ⭐ PATCH OBBLIGATORIA PER RENDER
  const PORT = process.env.PORT;

  app.listen(PORT, () => {
    console.log(`\n🎉 Server pronto! Porta ${PORT}`);
    console.log("📦 Catalogo caricato (cache locale)");
    console.log("⚡ Sync Airtable in real‑time attiva");
    console.log("🤖 Bot operativo");
    console.log("====================================\n");
  });
}

startServer();
