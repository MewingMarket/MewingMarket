/**
 * =========================================================
 * File: app/server/server.cjs
 * Entry point del server — versione coerente al router
 * =========================================================
 */

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.disable("x-powered-by");

// ROOT
const ROOT = path.resolve(__dirname, "..");

// LOGGING
require("./services/logging.cjs");

// PARSER
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// MIDDLEWARE GLOBALI
require("./middleware/cache.cjs")(app);
require("./middleware/uploads.cjs")(app);
require("./middleware/user-state.cjs")(app);
require("./middleware/context.cjs")(app);

// STATICI
app.use(express.static(path.join(ROOT, "public")));
app.use("/data", express.static(path.join(ROOT, "data")));

// ROUTER API PRINCIPALE
const router = require("./router.cjs");
app.use("/api", router);

// FRONTEND ROUTES
require("./routes/chat.cjs")(app);
require("./routes/chat-voice.cjs")(app);
require("./routes/newsletter.cjs")(app);
require("./routes/sitemap.cjs")(app);
require("./routes/sales.cjs")(app);
require("./routes/meta-feed.cjs")(app);
require("./routes/product-page.cjs")(app);
require("./routes/system-status.cjs")(app);

// BOOTSTRAP
async function startServer() {
  console.log("\n====================================");
  console.log("🚀 Avvio MewingMarket — BOOTSTRAP");
  console.log("====================================\n");

  await require("./startup/bootstrap.cjs")();
  require("./startup/startup-cron.cjs")();

  const PORT = process.env.PORT || 10000;

  app.listen(PORT, () => {
    console.log(`\n🎉 Server pronto! Porta ${PORT}`);
    console.log("📦 Catalogo caricato");
    console.log("🤖 Bot operativo");
    console.log("====================================\n");
  });
}

startServer();
