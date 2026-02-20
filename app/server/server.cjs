/**
 * =========================================================
 * File: app/server/server.cjs
 * Entry point del server — versione modulare + BOOTSTRAP ORDINATO
 * Versione patchata per nuovo store interno (senza Payhip)
 * =========================================================
 */

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
app.disable("x-powered-by");

/* ============================================================
   ROOT ASSOLUTA
============================================================ */
const ROOT = path.resolve(__dirname, "..");

/* ============================================================
   LOGGING (DEVE ESSERE CARICATO PRIMA DI TUTTO)
============================================================ */
require("./services/logging.cjs");

/* ============================================================
   PARSER
============================================================ */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* ============================================================
   MIDDLEWARE GLOBALI
============================================================ */
require("./middleware/cache.cjs")(app);
require("./middleware/uploads.cjs")(app);
require("./middleware/user-state.cjs")(app);
require("./middleware/context.cjs")(app);

/* ============================================================
   STATICI
============================================================ */
app.use(express.static(path.join(ROOT, "public")));

/* ⭐ PATCH: esponi anche /data per products.json */
app.use("/data", express.static(path.join(ROOT, "data")));

/* ============================================================
   ROUTES
============================================================ */
require("./routes/chat.cjs")(app);
require("./routes/chat-voice.cjs")(app);
require("./routes/newsletter.cjs")(app);
require("./routes/sitemap.cjs")(app);
require("./routes/sales.cjs")(app);
require("./routes/meta-feed.cjs")(app);

/* ❌ RIMOSSO: Payhip non esiste più */
// require("./routes/payhip-webhook.cjs")(app);
// require("./routes/payhip.cjs")(app);

/* ⭐ ROUTE PAGINA PRODOTTO (serve solo HTML) */
require("./routes/product-page.cjs")(app);

/* ⭐ API PRODOTTI (catalogo + singolo) */
require("./api-prodotti.cjs")(app);

/* STATUS SISTEMA */
require("./routes/system-status.cjs")(app);

/* ============================================================
   BOOTSTRAP ORDINATO (YouTube → Airtable)
============================================================ */
async function startServer() {
  console.log("\n====================================");
  console.log("🚀 Avvio MewingMarket — BOOTSTRAP");
  console.log("====================================\n");

  // ⭐ Carica bootstrap orchestrato (senza Payhip)
  await require("./startup/bootstrap.cjs")();

  /* ============================================================
     CRON JOBS (VERSIONE MODULARE)
  ============================================================= */
  require("./startup/startup-cron.cjs")();

  /* ============================================================
     AVVIO SERVER SOLO DOPO BOOTSTRAP
  ============================================================= */
  const PORT = process.env.PORT || 10000;

  app.listen(PORT, () => {
    console.log(`\n🎉 Server pronto! MewingMarket attivo sulla porta ${PORT}`);
    console.log("📦 Catalogo caricato e sincronizzato");
    console.log("🤖 Bot operativo");
    console.log("====================================\n");
  });
}

// ⭐ Avvio effettivo
startServer();
