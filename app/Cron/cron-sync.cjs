/**
 * =========================================================
 * File: app/cron/cron-sync.cjs
 * Eseguito da Render Cron Job
 * =========================================================
 */

const { syncAirtable } = require("../modules/airtable-sync.cjs");

(async () => {
  console.log("🚀 CRON: Avvio sync Airtable…");

  try {
    const ok = await syncAirtable();

    if (ok) {
      console.log("🟢 CRON: Sync Airtable completata");
    } else {
      console.log("⏭️ CRON: Sync Airtable NON completata");
    }
  } catch (err) {
    console.error("❌ CRON: Errore durante la sync Airtable:", err);
  }

  console.log("🏁 CRON: Fine processo, chiusura…");
  process.exit(0);
})();
