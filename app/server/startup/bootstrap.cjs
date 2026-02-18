/**
 * app/server/startup/bootstrap.cjs
 * Bootstrap completo — Payhip → YouTube → Airtable → Products
 */

const { syncPayhip } = require("../../services/payhip.cjs");
const { syncYouTube } = require("../../services/youtube.cjs");
const { syncAirtable, loadProducts } = require("../../modules/airtable.cjs");

module.exports = async function bootstrap() {
  console.log("\n===============================");
  console.log("🚀 BOOTSTRAP MewingMarket");
  console.log("===============================\n");

  global.catalogReady = false;

  /* 1) PAYHIP */
  console.log("🔄 Sync Payhip…");
  await syncPayhip();
  console.log("✅ Payhip completata\n");

  /* 2) YOUTUBE */
  console.log("🎥 Sync YouTube…");
  await syncYouTube();
  console.log("✅ YouTube completata\n");

  /* 3) AIRTABLE */
  console.log("📡 Sync Airtable…");
  await syncAirtable();
  console.log("✅ Airtable completata\n");

  /* 4) CARICAMENTO PRODOTTI FINALI */
  console.log("📦 Carico catalogo finale…");
  await loadProducts();
  console.log("🟢 Catalogo pronto\n");

  global.catalogReady = true;

  console.log("===============================");
  console.log("🎉 BOOTSTRAP COMPLETATO");
  console.log("===============================\n");
};
