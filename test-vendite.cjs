import axios from "axios";

const WEBHOOK_URL = "https://www.mewingmarket.it/webhook/payhip-mewingmarket_webhook_2025_4f9c2e7b1a";

const random = arr => arr[Math.floor(Math.random() * arr.length)];

const DEVICES = ["mobile", "desktop", "tablet"];
const LANGS = ["it", "en", "es", "fr"];
const INTENTS = ["acquisto", "info_prodotto", "dubbi", "prezzo", "carrello"];
const EXIT_PAGES = ["/", "/index.html", "/blog.html", "/prodotti.html", "/checkout.html"];
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
    UID: "test_" + prodotto.slug + "_" + tipo + "_" + Date.now(),
    Prodotto: prodotto.slug,
    Prezzo: prodotto.Prezzo,
    Device: random(DEVICES),
    Lingua: random(LANGS),
    UltimoIntent: random(INTENTS),
    UltimoMessaggio: random(MESSAGES),
    PaginaUscita: random(EXIT_PAGES),
    Timestamp: timestamp
  };

  let fields = {};

  if (tipo === "payhip") {
    fields = {
      ...base,
      Origine: "Payhip",
      UTMSource: null,
      UTMMedium: null,
      UTMCampaign: null,
      Referrer: "direct",
      PaginaIngresso: "direct"
    };
  }

  if (tipo === "site") {
    fields = {
      ...base,
      Origine: "Sito",
      UTMSource: "site",
      UTMMedium: "product_page",
      UTMCampaign: "test_vendite",
      Referrer: `https://www.mewingmarket.it/prodotto.html?slug=${prodotto.slug}`,
      PaginaIngresso: `/prodotto.html?slug=${prodotto.slug}`
    };
  }

  if (tipo === "social") {
    fields = {
      ...base,
      Origine: "Social",
      UTMSource: "instagram",
      UTMMedium: "bio_link",
      UTMCampaign: "social_test",
      Referrer: "https://instagram.com",
      PaginaIngresso: "https://instagram.com"
    };
  }

  console.log(`\n🔥 Invio vendita ${tipo.toUpperCase()} per ${prodotto.slug}`);
  console.log(fields);

  try {
    const res = await axios.post(WEBHOOK_URL, fields, {
      headers: { "Content-Type": "application/json" }
    });
    console.log("✅ Risposta server:", res.data);
  } catch (err) {
    console.error("❌ Errore invio webhook:", err?.response?.data || err?.message);
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
    console.error("❌ Errore caricamento prodotti:", err?.message);
  }
})();
