/**
 * =========================================================
 * COLD-START — Versione 2026.100
 * Render-friendly warmup:
 * - Precarica DB
 * - Precarica router
 * - Precarica moduli lenti
 * - Evita cold start Render
 * - Nessun blocco del server
 * =========================================================
 */

const path = require("path");

module.exports = async function coldStart(app) {
  console.log("\n====================================");
  console.log("❄️  COLD START — Warmup Render");
  console.log("====================================");

  try {
    /* =========================================================
       1) WARMUP DB (query velocissima)
    ========================================================== */
    console.log("🗄️  Warmup DB…");
    const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
    try {
      db.prepare("SELECT 1").get();
      console.log("   ✅ DB pronto");
    } catch (err) {
      console.error("   ❌ Errore warmup DB:", err.message);
    }

    /* =========================================================
       2) WARMUP ROUTER (precarica tutte le route)
    ========================================================== */
    console.log("🛣️  Warmup router…");
    try {
      require(path.join(process.cwd(), "app/server/router.cjs"));
      console.log("   ✅ Router precaricato");
    } catch (err) {
      console.error("   ❌ Errore warmup router:", err.message);
    }

    /* =========================================================
       3) WARMUP MODULI LENTI (richiesti spesso)
    ========================================================== */
    console.log("📦 Warmup moduli…");

    const modulesToWarm = [
      "services/youtube.cjs",
      "routes/api-prodotti-new.cjs",
      "routes/product-page.cjs",
      "routes/api-feedback.cjs",
      "routes/ordini-utente.cjs",
      "routes/api-vendite-download.cjs",
      "routes/admin-dashboard.cjs",
      "routes/admin-feedback.cjs"
    ];

    for (const m of modulesToWarm) {
      try {
        require(path.join(process.cwd(), "app/server", m));
        console.log("   📌 Precaricato:", m);
      } catch (err) {
        console.log("   ⚠️  Skip modulo:", m, "-", err.message);
      }
    }

    /* =========================================================
       4) WARMUP HTTP (ping interno)
    ========================================================== */
    console.log("🌐 Warmup HTTP interno…");

    try {
      const fetch = (await import("node-fetch")).default;
      await fetch("http://localhost:" + process.env.PORT + "/health");
      console.log("   ✅ Ping interno OK");
    } catch (err) {
      console.log("   ⚠️  Ping interno fallito (non blocca):", err.message);
    }

    /* =========================================================
       COMPLETATO
    ========================================================== */
    console.log("====================================");
    console.log("❄️  COLD START COMPLETATO");
    console.log("====================================\n");

  } catch (err) {
    console.error("❌ ERRORE COLD START:", err);
  }
};
