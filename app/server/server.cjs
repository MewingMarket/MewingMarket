/**
 * app/server/server.cjs
 * Entry point del server — versione modulare
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
   MIDDLEWARE GLOBALI
============================================================ */
require("./middleware/cache.cjs")(app);
require("./middleware/uploads.cjs")(app);
require("./middleware/user-state.cjs")(app);
require("./middleware/context.cjs")(app);

/* ============================================================
   PARSER
============================================================ */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

/* ============================================================
   STATICI
============================================================ */
app.use(express.static(path.join(ROOT, "public")));

/* ============================================================
   ROUTES
============================================================ */
require("./routes/chat.cjs")(app);
require("./routes/chat-voice.cjs")(app);
require("./routes/newsletter.cjs")(app);
require("./routes/sitemap.cjs")(app);
require("./routes/payhip-webhook.cjs")(app);
require("./routes/sales.cjs")(app);
require("./routes/meta-feed.cjs")(app);
require("./routes/product-page.cjs")(app);
require("./routes/system-status.cjs")(app);

/* ============================================================
   STARTUP SYNC (Airtable + Payhip + YouTube)
============================================================ */
require("./startup/startup-sync.cjs")();

/* ============================================================
   CRON JOBS
============================================================ */
require("./cron/cron-payhip.cjs")();
require("./cron/cron-youtube.cjs")();
require("./cron/cron-airtable.cjs")();
require("./cron/cron-new-product.cjs")();

/* ============================================================
   AVVIO SERVER
============================================================ */
const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`🚀 MewingMarket attivo sulla porta ${PORT}`);
});
