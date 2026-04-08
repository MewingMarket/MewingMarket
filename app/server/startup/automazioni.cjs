// =====================================================
// AVVIO AUTOMAZIONI (SCHEDULER + TRIGGER) — SAFE MODE
// =====================================================

const path = require("path");

console.log("⚙️  Avvio automazioni…");

try {
  // Require assoluto blindato
  require(path.join(process.cwd(), "app/modules/automazioni/orchestratore.cjs"));

  console.log("✅ Automazioni avviate");
} catch (err) {
  console.error("❌ Errore avvio automazioni:", err);
}
