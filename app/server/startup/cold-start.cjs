// =========================================================
// COLD-START — Versione LAZY-SAFE 2060
// Nessun avvio automatico. Nessun preload pesante.
// Esegue SOLO quando chiamato da backendloader.
// =========================================================

const path = require("path");

module.exports = async function coldStartLazy() {
  console.log("\n====================================");
  console.log("❄️  COLD START — LAZY SAFE MODE 2060");
  console.log("====================================");

  try {
    // ============================================================
    // 1) WARMUP DB (leggero, sicuro)
    // ============================================================
    console.log("🗄️  Warmup DB…");
    try {
      const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
      db.prepare("SELECT 1").get();
      console.log("   ✅ DB pronto");
    } catch (err) {
      console.error("   ❌ Errore warmup DB:", err.message);
    }

    // ============================================================
    // 2) NESSUN PRELOAD DI ROUTER / INDEX
    // ============================================================
    console.log("🟧 Router e index NON precaricati (LAZY MODE)");

    // ============================================================
    // 3) NESSUN MODULO LENTO
    // ============================================================
    console.log("🟧 Moduli lenti disattivati (YouTube, logging esterno)");

    // ============================================================
    // 4) NESSUN FETCH INTERNO
    // ============================================================
    console.log("🟧 Ping interno disattivato (SAFE)");

    // ============================================================
    // COMPLETATO
    // ============================================================
    console.log("====================================");
    console.log("❄️  COLD START COMPLETATO (LAZY SAFE 2060)");
    console.log("====================================\n");

    return { ok: true };

  } catch (err) {
    console.error("❌ ERRORE COLD START:", err);
    return { ok: false, error: err.message };
  }
};
