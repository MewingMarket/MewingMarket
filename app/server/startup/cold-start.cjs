/**
 * =========================================================
 * COLD-START — Versione 2027.1
 * Warmup ottimizzato per Render:
 * - Precarica DB
 * - Precarica router universale
 * - Precarica index.cjs (tutte le funzioni)
 * - Precarica moduli critici (YouTube, logging)
 * - Evita cold start senza caricare router Express
 * =========================================================
 */

const path = require("path");

module.exports = async function coldStart(app) {
  console.log("\n====================================");
  console.log("❄️  COLD START — Warmup Render");
  console.log("====================================");

  try {
    /* =========================================================
       1) WARMUP DB
    ========================================================== */
    console.log("🗄️  Warmup DB…");
    try {
      const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
      db.prepare("SELECT 1").get();
      console.log("   ✅ DB pronto");
    } catch (err) {
      console.error("   ❌ Errore warmup DB:", err.message);
    }

    /* =========================================================
       2) WARMUP ROUTER UNIVERSALE
       (carica index.cjs + router.cjs)
    ========================================================== */
    console.log("🛣️  Warmup router universale…");
    try {
      require(path.join(process.cwd(), "app/server/index.cjs"));
      require(path.join(process.cwd(), "app/server/router.cjs"));
      console.log("   ✅ Router universale precaricato");
    } catch (err) {
      console.error("   ❌ Errore warmup router:", err.message);
    }

    /* =========================================================
       3) WARMUP MODULI LENTI REALI
       (solo moduli che fanno I/O o API esterne)
    ========================================================== */
    console.log("📦 Warmup moduli critici…");

    const modulesToWarm = [
      "services/youtube.cjs",
      "services/logging.cjs"
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
