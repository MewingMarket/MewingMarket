/* =========================================================
   FILE: app/server/startup/cron-auto-opt.cjs
   DESCRIZIONE:
   Cron mensile — Auto‑Ottimizzazione Catalogo (AI)
   Versione SAFE MODE HARD — 2027.1
========================================================= */

const path = require("path");
const ROOT = process.cwd();
const R = (p) => require(path.join(ROOT, "app", p));

/* =========================================================
   REQUIRE ASSOLUTI
========================================================= */
const { autoOttimizzaCatalogo } = R("server/services/catalogo-auto-opt.cjs");

/* =========================================================
   STATO INTERNO — SAFE MODE HARD
========================================================= */
let isRunning = false;
let lastRun = null;

/* =========================================================
   FUNZIONE SICURA
========================================================= */
async function safeRun() {
  if (isRunning) {
    console.log("⛔ [CRON AUTO-OPT] Già in esecuzione → skip");
    return;
  }

  isRunning = true;
  const start = Date.now();
  console.log("🚀 [CRON AUTO-OPT] Avvio ottimizzazione catalogo…");

  const timeout = setTimeout(() => {
    console.error("⛔ [CRON AUTO-OPT] TIMEOUT 5 minuti → forzo stop");
    isRunning = false;
  }, 5 * 60 * 1000);

  try {
    const result = await autoOttimizzaCatalogo();
    console.log("📄 [CRON AUTO-OPT] Log pipeline:");
    result.log.forEach(l => console.log("   " + l));

    lastRun = new Date().toISOString();
    console.log("✅ [CRON AUTO-OPT] Completato in", (Date.now() - start) + "ms");

  } catch (err) {
    console.error("❌ [CRON AUTO-OPT] Errore:", err.message);

  } finally {
    clearTimeout(timeout);
    isRunning = false;
  }
}

/* =========================================================
   SCHEDULAZIONE MENSILE
   - Esegue ogni giorno alle 03:00
   - Parte SOLO il 1° giorno del mese
========================================================= */
function startCron() {
  console.log("⏳ [CRON AUTO-OPT] Avvio cron mensile (ogni giorno alle 03:00)…");

  setInterval(() => {
    const now = new Date();
    const hh = now.getHours();
    const mm = now.getMinutes();

    // Esegui solo alle 03:00
    if (hh !== 3 || mm !== 0) return;

    // Esegui solo il 1° giorno del mese
    if (now.getDate() !== 1) return;

    console.log("📆 [CRON AUTO-OPT] Trigger mensile → eseguo safeRun()");
    safeRun();

  }, 60 * 1000); // check ogni minuto
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = startCron;
