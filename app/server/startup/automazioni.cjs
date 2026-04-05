// =====================================================
// AVVIO AUTOMAZIONI (SCHEDULER + TRIGGER)
// =====================================================

console.log("⚙️  Avvio automazioni…");

try {
  require("../../modules/automazioni/orchestratore.cjs");
  console.log("✅ Automazioni avviate");
} catch (err) {
  console.error("❌ Errore avvio automazioni:", err);
}
