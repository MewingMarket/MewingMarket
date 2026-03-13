/**
 * =========================================================
 * File: app/server/server.cjs
 * Entry point del server — versione DEFINITIVA (NO SYNC)
 * =========================================================
 */

// 🔥 CATTURA ERRORI NASCOSTI
process.on("uncaughtException", err => {
  console.error("🔥 UNCAUGHT EXCEPTION:", err);
});
process.on("unhandledRejection", err => {
  console.error("🔥 UNHANDLED REJECTION:", err);
});

// 🔧 Funzione per rallentare i log
const wait = (ms) => new Promise(res => setTimeout(res, ms));

console.log(">> SERVER STARTING…");
console.log(">> PACKAGE TYPE:", require("../../package.json").type);

const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");

console.log(">> EXPRESS LOADED");

const app = express();
app.disable("x-powered-by");

// ROOT = /project/src/app
const ROOT = path.resolve("app");
console.log(">> ROOT PATH:", ROOT);

// =========================================================
// AVVIO SEQUENZIALE
// =========================================================
(async () => {
  console.log(">> LOADING logging.cjs");
  await wait(300);
  require("./services/logging.cjs");

  console.log(">> APPLYING PARSER MIDDLEWARE");
  await wait(300);
  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  console.log(">> LOADING cache.cjs");
  await wait(300);
  require("./middleware/cache.cjs")(app);

  console.log(">> LOADING uploads.cjs");
  await wait(300);
  require("./middleware/uploads.cjs")(app);

  console.log(">> LOADING context.cjs");
  await wait(300);
  require("./middleware/context.cjs")(app);

  // =========================================================
  // STATICI FRONTEND
  // =========================================================
  console.log(">> REGISTER STATIC ROUTES");
  await wait(300);
  app.use(express.static(path.resolve("app/public")));
  app.use("/data", express.static(path.resolve("app/data")));

  // =========================================================
  // ADMIN
  // =========================================================
  console.log(">> REGISTER ADMIN ROUTES");
  await wait(300);
  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/admin/admin-login.html"));
  });
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  // =========================================================
  // API
  // =========================================================
  console.log(">> LOADING router.cjs");
  await wait(300);
  const router = require("./router.cjs");
  app.use("/api", router);

  // =========================================================
  // DEBUG DB (HTML)
  // =========================================================
  console.log(">> LOADING debug-db.cjs");
  await wait(300);
  app.use("/api", require("./routes/debug-db.cjs"));

  // =========================================================
  // ROUTE FRONTEND
  // =========================================================
  console.log(">> LOADING FRONTEND ROUTES");
  await wait(300);
  require("./routes/chat.cjs")(app);
  await wait(300);
  require("./routes/chat-voice.cjs")(app);
  await wait(300);
  require("./routes/newsletter.cjs")(app);
  await wait(300);
  require("./routes/sitemap.cjs")(app);
  await wait(300);
  require("./routes/sales.cjs")(app);
  await wait(300);
  require("./routes/meta-feed.cjs")(app);
  await wait(300);
  require("./routes/product-page.cjs")(app);
  await wait(300);
  require("./routes/system-status.cjs")(app);
  await wait(300);
  require("./routes/versione.cjs")(app);

  // =========================================================
  // BOOTSTRAP
  // =========================================================
  async function startServer() {
    console.log("\n====================================");
    console.log("🚀 STARTING BOOTSTRAP");
    console.log("====================================\n");
    await wait(300);

    try {
      console.log(">> CALLING bootstrap.cjs");
      await wait(300);
      await require("./startup/bootstrap.cjs")();
      console.log(">> BOOTSTRAP COMPLETED");
    } catch (err) {
      console.error("❌ BOOTSTRAP ERROR:", err);
    }

    console.log(">> PREPARING TO LISTEN…");
    await wait(300);

    const PORT = process.env.PORT;
    console.log(">> process.env.PORT =", PORT);
    await wait(300);

    if (!PORT) {
      console.error("❌ ERRORE: Render non ha assegnato la porta!");
    }

    console.log(">> CALLING app.listen…");
    await wait(300);

    app.listen(PORT, () => {
      console.log(`\n🎉 SERVER LISTENING ON PORT ${PORT}`);
      console.log("📦 Catalogo caricato (cache locale)");
      console.log("⚡ Server pronto e online");
      console.log("🤖 Bot operativo");
      console.log("====================================\n");

      // =========================================================
      // LOG PERIODICO DEL CONTENUTO DEL DB
      // =========================================================
      const db = require("./db/database.cjs");
      setInterval(() => {
        try {
          const utenti = db.prepare("SELECT * FROM utenti").all();
          console.log("📌 UTENTI NEL DB:", utenti);
        } catch (err) {
          console.log("Errore lettura DB:", err.message);
        }
      }, 15000);

      // =========================================================
      // SYNC INIZIALE IN BACKGROUND (NON BLOCCA IL SERVER)
      // =========================================================
      setTimeout(async () => {
        try {
          console.log("⏳ Sync iniziale in background…");
          const { syncAirtable } = require("../modules/airtable-sync.cjs");
          const ok = await syncAirtable();
          if (ok) {
            console.log("🟢 Sync iniziale completata");
          } else {
            console.log("⚠️ Sync iniziale NON completata");
          }
        } catch (err) {
          console.error("❌ Errore sync iniziale:", err);
        }
      }, 2000);
    });
  }

  console.log(">> CALLING startServer()");
  await wait(300);
  startServer();
})();
