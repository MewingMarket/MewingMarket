// =========================================================
// CRON AUTO-OPT — Versione LAZY-SAFE 2060
// Nessun avvio automatico, nessun setInterval globale.
// Esegue SOLO quando chiamato da backendloader o da un endpoint.
// =========================================================

const path = require("path");
const ROOT = process.cwd();

// Import LAZY del servizio
function loadAutoOpt() {
  return require(path.join(ROOT, "app/server/services/catalogo-auto-opt.cjs")).autoOttimizzaCatalogo;
}

module.exports = async function runAutoOptLazy() {
  console.log("⏳ [AUTO-OPT 2060] Avvio ottimizzazione ON-DEMAND (SAFE MODE)");

  // 🔒 Protezione: impedisce esecuzioni sovrapposte
  if (global.__AUTO_OPT_RUNNING__) {
    console.log("🟧 [AUTO-OPT] Ignorato: processo già in esecuzione");
    return { ok: false, skip: true, reason: "running" };
  }

  global.__AUTO_OPT_RUNNING__ = true;

  const MAX_RUNTIME_MS = 5 * 60 * 1000; // 5 minuti
  const start = Date.now();

  try {
    const autoOttimizzaCatalogo = loadAutoOpt();

    console.log("🚀 [AUTO-OPT] Avvio pipeline…");

    // Timeout di sicurezza
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Timeout AUTO-OPT")), MAX_RUNTIME_MS)
    );

    // Esecuzione protetta
    const result = await Promise.race([
      autoOttimizzaCatalogo(),
      timeoutPromise
    ]);

    console.log("📄 [AUTO-OPT] Log pipeline:");
    if (result?.log) {
      result.log.forEach(l => console.log("   " + l));
    }

    console.log("🟩 [AUTO-OPT] Completato in", (Date.now() - start) + "ms");

  } catch (err) {
    console.error("❌ [AUTO-OPT] Errore:", err.message);
  }

  global.__AUTO_OPT_RUNNING__ = false;

  return { ok: true, elapsed: Date.now() - start };
};
