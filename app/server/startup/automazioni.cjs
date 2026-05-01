/* FILE: app/server/startup/automazioni.cjs */
// =====================================================
// AVVIO AUTOMAZIONI — SAFE MODE HARD
// Tutte le automazioni sono disattivate temporaneamente
// per evitare loop, scheduler, trigger e OOM.
// =====================================================

console.log("⚙️  Avvio automazioni (SAFE MODE HARD)…");

// 🔥 FIREWALL AUTOMAZIONI — evita doppi avvii nello stesso processo
if (global.__automazioni_started) {
  console.log("⚠️ Automazioni già avviate in questo processo — skip");
} else {
  global.__automazioni_started = true;

  // 🚫 AUTOMAZIONI DISATTIVATE
  console.log("🟧 Automazioni DISATTIVATE in SAFE MODE HARD");
  console.log("🟧 orchestratore.cjs NON caricato");
  console.log("🟧 scheduler e trigger NON avviati");

  // (Nessun require, nessun loop, nessun watcher)
}
