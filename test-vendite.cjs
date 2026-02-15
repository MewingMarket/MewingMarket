// test-vendite.js
const axios = require("axios");

// Funzione per stampare header leggibili
function logHeader(title, icon) {
  console.log("\n====================================");
  console.log(`${icon}  ${title}`);
  console.log("====================================\n");
}

// Funzione generica per inviare il webhook
async function sendWebhook(payload, secret) {
  try {
    const url = `https://www.mewingmarket.it/webhook/payhip-${secret}`;

    console.log("📤 Invio webhook a:", url);
    console.log("📦 Payload inviato:");
    console.log(payload);

    const res = await axios.post(url, payload, {
      headers: { "Content-Type": "application/json" }
    });

    console.log("\n✅ Risposta server:");
    console.log(res.data);

    console.log("\n🔍 Controlla Airtable + Dashboard per verificare la vendita.\n");

  } catch (err) {
    console.error("\n❌ Errore durante il test:");
    console.error(err?.response?.data || err);
  }
}

/* ---------------------------------------------------------
   1) TEST VENDITA PAYHIP DIRETTA
--------------------------------------------------------- */
async function testPayhipDirect() {
  logHeader("TEST VENDITA DIRETTA PAYHIP", "🔵");

  const payload = {
    product_id: "TEST_PAYHIP_001",
    product_name: "Vendita Diretta Payhip",
    price: "14.99",
    email: "cliente-payhip@mewingmarket.it",
    timestamp: new Date().toISOString(),
    source: "payhip_direct",
    referrer: "direct",
    utm_source: null,
    utm_medium: null,
    utm_campaign: null,
    log_type: "PAYHIP_DIRECT"
  };

  await sendWebhook(payload, process.env.PAYHIP_WEBHOOK_SECRET);
}

/* ---------------------------------------------------------
   2) TEST VENDITA DAL SITO
--------------------------------------------------------- */
async function testFromSite() {
  logHeader("TEST VENDITA DAL SITO", "🟢");

  const payload = {
    product_id: "TEST_SITE_001",
    product_name: "Vendita dal Sito",
    price: "19.99",
    email: "cliente-sito@mewingmarket.it",
    timestamp: new Date().toISOString(),
    source: "site",
    referrer: "https://www.mewingmarket.it/prodotto/test",
    utm_source: "site",
    utm_medium: "product_page",
    utm_campaign: "test_vendite",
    log_type: "SITE_SALE"
  };

  await sendWebhook(payload, process.env.PAYHIP_WEBHOOK_SECRET);
}

/* ---------------------------------------------------------
   3) TEST VENDITA DA SOCIAL
--------------------------------------------------------- */
async function testFromSocial() {
  logHeader("TEST VENDITA DA SOCIAL", "🟣");

  const payload = {
    product_id: "TEST_SOCIAL_001",
    product_name: "Vendita da Social",
    price: "24.99",
    email: "cliente-social@mewingmarket.it",
    timestamp: new Date().toISOString(),
    source: "social",
    referrer: "https://instagram.com",
    utm_source: "instagram",
    utm_medium: "bio_link",
    utm_campaign: "social_test",
    log_type: "SOCIAL_SALE"
  };

  await sendWebhook(payload, process.env.PAYHIP_WEBHOOK_SECRET);
}

/* ---------------------------------------------------------
   ESECUZIONE AUTOMATICA DI TUTTI I TEST
--------------------------------------------------------- */
async function runAllTests() {
  await testPayhipDirect();
  await testFromSite();
  await testFromSocial();
}

runAllTests();
