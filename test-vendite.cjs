import axios from "axios";

const WEBHOOK_URL = "https://www.mewingmarket.it/webhook/payhip-mewingmarket_webhook_2025_4f9c2e7b1e";

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const DEVICES = ["mobile", "desktop", "tablet"];
const LANGS = ["it", "en", "es", "fr"];
const INTENTS = ["acquisto", "info_prodotto", "dubbi", "prezzo", "carrello"];
const EXIT_PAGES = [
  "/",
  "/index.html",
  "/blog.html",
  "/prodotti.html",
  "/checkout.html"
];
const MESSAGES = [
  "Sto valutando questo prodotto",
  "Mi interessa capire come funziona",
  "Ok, lo compro",
  "Vorrei più informazioni",
  "Sembra interessante"
];

async function inviaVendita(tipo, prodotto) {
  const timestamp = new Date().toISOString();

  const base = {
    product_id: prodotto.slug,
    product_name: prodotto.Titolo,
    price: String(prodotto.Prezzo),
    timestamp,
    UID: "test_" + prodotto.slug + "_" + tipo + "_" + Date.now(),
    Device: random(DEVICES),
    Lingua: random(LANGS),
    UltimoIntent: random(INTENTS),
    UltimoMessaggio: random(MESSAGES),
    PaginaUscita: random(EXIT_PAGES)
  };

  let payload = {};

  if (tipo === "payhip") {
    payload = {
      ...base,
      email: `test-payhip-${prodotto.slug}@mewingmarket.it`,
      source: "payhip_direct",
      Origine: "Payhip",
      Referrer: "direct",
      UTMSource: null,
      UTMMedium: null,
      UTMCampaign: null,
      PaginaIngresso: "direct"
    };
  }

  if (tipo === "site") {
    payload = {
      ...base,
      email: `test-site-${prodotto.slug}@mewingmarket.it`,
      source: "site",
      Origine: "Sito",
      Referrer: `https://www.mewingmarket.it/prodotto.html?slug=${prodotto.slug}`,
      UTMSource: "site",
      UTMMedium: "product_page",
      UTMCampaign: "test_vendite",
      PaginaIngresso: `/prodotto.html?slug=${prodotto.slug}`
    };
  }

  if (tipo === "social") {
    payload = {
      ...base,
      email: `test-social-${prodotto.slug}@mewingmarket.it`,
      source: "social",
      Origine: "Social",
      Referrer: "https://instagram.com",
      UTMSource: "instagram",
      UTMMedium: "bio_link",
      UTMCampaign: "social_test",
      PaginaIngresso: "https://instagram.com"
    };
  }

  console.log(`\n===============================`);
  console.log(`🔥 TEST VENDITA REALISTICA: ${tipo.toUpperCase()} — ${prodotto.slug}`);
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
      await new Promise(r => setTimeout(r, 1500));

      await inviaVendita("site", prodotto);
      await new Promise(r => setTimeout(r, 1500));

      await inviaVendita("social", prodotto);
      await new Promise(r => setTimeout(r, 1500));
    }

    console.log("\n🎉 Test iper‑realistico completato.");
  } catch (err) {
    console.error("❌ Errore caricamento prodotti:", err?.message || err);
  }
})();
