import axios from "axios";

const WEBHOOK_URL = "https://www.mewingmarket.it/webhook/payhip-mewingmarket/webhook_2025_4f9c2e7b1e";

async function inviaVendita(tipo, prodotto) {
  const timestamp = new Date().toISOString();
  const base = {
    product_id: prodotto.slug,
    product_name: prodotto.Titolo,
    price: String(prodotto.Prezzo),
    timestamp,
    log_type: tipo.toUpperCase() + "_SALE"
  };

  let payload = {};

  if (tipo === "payhip") {
    payload = {
      ...base,
      email: `test-payhip-${prodotto.slug}@mewingmarket.it`,
      source: "payhip_direct",
      referrer: "direct",
      utm_source: null,
      utm_medium: null,
      utm_campaign: null
    };
  }

  if (tipo === "site") {
    payload = {
      ...base,
      email: `test-site-${prodotto.slug}@mewingmarket.it`,
      source: "site",
      referrer: `https://www.mewingmarket.it/prodotto.html?slug=${prodotto.slug}`,
      utm_source: "site",
      utm_medium: "product_page",
      utm_campaign: "test_vendite"
    };
  }

  if (tipo === "social") {
    payload = {
      ...base,
      email: `test-social-${prodotto.slug}@mewingmarket.it`,
      source: "social",
      referrer: "https://instagram.com",
      utm_source: "instagram",
      utm_medium: "bio_link",
      utm_campaign: "social_test"
    };
  }

  console.log(`\n===============================`);
  console.log(`🟣 TEST VENDITA: ${tipo.toUpperCase()} — ${prodotto.slug}`);
  console.log(`===============================`);
  console.log(`📦 Payload inviato:\n`, payload);

  try {
    const res = await axios.post(WEBHOOK_URL, payload, {
      headers: { "Content-Type": "application/json" }
    });
    console.log(`✅ Risposta server:\n`, res.data);
  } catch (err) {
    console.error(`❌ Errore invio webhook:\n`, err?.response?.data || err?.message || err);
  }
}

(async () => {
  try {
    const res = await axios.get("https://www.mewingmarket.it/products.json");
    const prodotti = res.data;

    for (const prodotto of prodotti) {
      await inviaVendita("payhip", prodotto);
      await inviaVendita("site", prodotto);
      await inviaVendita("social", prodotto);
    }

    console.log("\n✅ Test completato.");
  } catch (err) {
    console.error("❌ Errore caricamento prodotti:", err?.message || err);
  }
})();
