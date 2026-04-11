/**
 * =========================================================
 * File: app/server/scripts/test-vendite.cjs
 * Test vendite SQL 2026 — UTM + origini sintetiche
 * Da eseguire in shell: node app/server/scripts/test-vendite.cjs
 * =========================================================
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const { registraVendita } = require(path.join(process.cwd(), "app/modules/vendite-sql.cjs"));

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const ORIGINI = [
  "direct",
  "site",
  "social_instagram",
  "social_tiktok",
  "social_youtube",
  "social_facebook",
  "email",
  "bot",
  "referral",
  "paid_ads",
  "organic_search",
  "unknown"
];

function buildUTM(origine, prodotto) {
  const slug = (prodotto.slug || prodotto.titolo_breve || prodotto.titolo || "prodotto")
    .toString()
    .toLowerCase()
    .replace(/\s+/g, "-");

  switch (origine) {
    case "site":
      return {
        origine: "Sito",
        utm_source: "site",
        utm_medium: "product_page",
        utm_campaign: "test_vendite_site",
        referrer: `https://www.mewingmarket.it/prodotto?id=${prodotto.id}`
      };

    case "social_instagram":
      return {
        origine: "Social",
        utm_source: "instagram",
        utm_medium: "bio_link",
        utm_campaign: "social_ig_test",
        referrer: "https://instagram.com"
      };

    case "social_tiktok":
      return {
        origine: "Social",
        utm_source: "tiktok",
        utm_medium: "profile_link",
        utm_campaign: "social_tt_test",
        referrer: "https://www.tiktok.com"
      };

    case "social_youtube":
      return {
        origine: "Social",
        utm_source: "youtube",
        utm_medium: "description_link",
        utm_campaign: "social_yt_test",
        referrer: "https://www.youtube.com"
      };

    case "social_facebook":
      return {
        origine: "Social",
        utm_source: "facebook",
        utm_medium: "post_link",
        utm_campaign: "social_fb_test",
        referrer: "https://www.facebook.com"
      };

    case "email":
      return {
        origine: "Email",
        utm_source: "email",
        utm_medium: "newsletter",
        utm_campaign: "email_test",
        referrer: "https://mail.mewingmarket.it"
      };

    case "bot":
      return {
        origine: "Bot",
        utm_source: "bot",
        utm_medium: "assistant",
        utm_campaign: "bot_test",
        referrer: "https://www.mewingmarket.it/bot"
      };

    case "referral":
      return {
        origine: "Referral",
        utm_source: "partner_site",
        utm_medium: "referral",
        utm_campaign: "referral_test",
        referrer: "https://partner-example.com"
      };

    case "paid_ads":
      return {
        origine: "Paid",
        utm_source: "google",
        utm_medium: "cpc",
        utm_campaign: "ads_test",
        referrer: "https://www.google.com"
      };

    case "organic_search":
      return {
        origine: "Organic",
        utm_source: "google",
        utm_medium: "organic",
        utm_campaign: "organic_test",
        referrer: "https://www.google.com"
      };

    case "direct":
      return {
        origine: "Direct",
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null
      };

    case "unknown":
    default:
      return {
        origine: null,
        utm_source: null,
        utm_medium: null,
        utm_campaign: null,
        referrer: null
      };
  }
}

async function main() {
  console.log("🔥 Test vendite SQL 2026 — INIZIO");

  const prodotti = db.prepare(`
    SELECT id, titolo_breve, titolo, prezzo_cent
    FROM prodotti
    ORDER BY id ASC
  `).all();

  if (!prodotti.length) {
    console.error("❌ Nessun prodotto trovato in DB.");
    process.exit(1);
  }

  console.log(`📦 Prodotti trovati: ${prodotti.length}`);

  for (const prodotto of prodotti) {
    console.log(`\n🧩 Prodotto ID ${prodotto.id} — ${prodotto.titolo_breve || prodotto.titolo || ""}`);

    for (const origine of ORIGINI) {
      const utm = buildUTM(origine, prodotto);

      const uid = `test_${prodotto.id}_${origine}_${Date.now()}`;

      const prezzo_cent = prodotto.prezzo_cent || 0;

      console.log(`  ➜ Inserisco vendita: origine=${origine}, uid=${uid}`);

      await registraVendita({
        uid,
        prodotto_id: prodotto.id,
        prezzo_cent,
        origine: utm.origine,
        utm_source: utm.utm_source,
        utm_campaign: utm.utm_campaign,
        utm_medium: utm.utm_medium,
        referrer: utm.referrer
      });

      await sleep(300);
    }
  }

  console.log("\n🎉 Test vendite SQL 2026 completato.");
  process.exit(0);
}

main().catch(err => {
  console.error("❌ Errore test vendite SQL:", err);
  process.exit(1);
});
