/* FILE: app/server/startup/automazioni.cjs */
// =====================================================
// AVVIO AUTOMAZIONI (SCHEDULER + TRIGGER) — SAFE MODE
// =====================================================

const path = require("path");

console.log("⚙️  Avvio automazioni…");

// 🔥 FIREWALL AUTOMAZIONI — evita doppi avvii nello stesso processo
if (global.__automazioni_started) {
  console.log("⚠️ Automazioni già avviate in questo processo — skip");
} else {
  global.__automazioni_started = true;

  try {
    // Require assoluto blindato
    require(path.join(process.cwd(), "app/modules/automazioni/orchestratore.cjs"));

    console.log("✅ Automazioni avviate");
  } catch (err) {
    console.error("❌ Errore avvio automazioni:", err);
  }
}
