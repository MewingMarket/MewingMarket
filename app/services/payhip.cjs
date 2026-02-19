// app/services/payhip.cjs
// Sync Payhip via scraping HTML (Playwright-core, future-proof)

const { chromium } = require("playwright-core");
const { updateFromPayhip, removeMissingPayhipProducts } = require("../modules/payhip.cjs");

// URL del tuo store Payhip
const PAYHIP_STORE_URL = "https://payhip.com/MewingMarket";

// Credenziali Airtable (coerenti con tutto il backend)
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

// Guard di sicurezza
function canUseAirtable() {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE || !AIRTABLE_TABLE_NAME) {
    console.log("⏭️ Payhip → Airtable skipped: missing PAT / BASE / TABLE_NAME");
    return false;
  }
  return true;
}

/* =========================================================
   1) Scarica HTML dello store con Playwright-core
========================================================= */
async function fetchStoreHtml() {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(PAYHIP_STORE_URL, {
      waitUntil: "networkidle"
    });

    // aspetta che ci sia almeno un link prodotto
    await page.waitForSelector("a[href*='/b/']", { timeout: 15000 });

    const html = await page.content();
    await browser.close();
    return html || "";
  } catch (err) {
    console.error("[PAYHIP] errore fetchStoreHtml (Playwright-core):", err.message);
    if (browser) await browser.close();
    return "";
  }
}

/* =========================================================
   2) Estrai TUTTI i link dei prodotti /b/XXXXX
========================================================= */
function extractProductSlugs(html) {
  if (!html) return [];

  const slugs = new Set();
  const regex = /\/b\/([A-Za-z0-9]+)/g;

  let match;
  while ((match = regex.exec(html)) !== null) {
    slugs.add(match[1]);
  }

  return Array.from(slugs);
}

/* =========================================================
   3) Scarica pagina singolo prodotto con Playwright-core
========================================================= */
async function fetchProductPage(slug) {
  let browser;
  try {
    const url = `https://payhip.com/b/${slug}`;

    browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle" });

    // aspetta il titolo prodotto
    await page.waitForSelector("h1", { timeout: 15000 });

    const html = await page.content();
    await browser.close();

    return { url, html: html || "" };
  } catch (err) {
    console.error("[PAYHIP] errore fetchProductPage (Playwright-core):", slug, err.message);
    if (browser) await browser.close();
    return { url: "", html: "" };
  }
}

/* =========================================================
   4) Parsing HTML prodotto (fallback se JSON-LD non basta)
========================================================= */
function parseProduct(html, slug, url) {
  if (!html) {
    return {
      slug,
      url,
      title: "",
      price: "",
      image: "",
      description: ""
    };
  }

  const getText = (regex) => {
    const m = regex.exec(html);
    return m ? m[1].trim() : "";
  };

  const title = getText(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const price = getText(/class="product-price"[^>]*>([\s\S]*?)<\/[^>]+>/i);
  const img = getText(/<img[^>]*class="[^"]*product-image[^"]*"[^>]*src="([^"]+)"/i);
  const desc = getText(/class="product-description"[^>]*>([\s\S]*?)<\/div>/i);

  const clean = (s) =>
    s
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+\n/g, "\n")
      .trim();

  return {
    slug,
    url,
    title: clean(title),
    price: clean(price),
    image: img || "",
    description: clean(desc)
  };
}

/* =========================================================
   5) Costruisci catalogo completo Payhip
========================================================= */
async function fetchPayhipCatalog() {
  try {
    console.log("[PAYHIP] fetch_store_html", PAYHIP_STORE_URL);

    const html = await fetchStoreHtml();
    if (!html) {
      return { success: false, products: [], reason: "empty_html" };
    }

    const slugs = extractProductSlugs(html);
    console.log("[PAYHIP] found_slugs", slugs);

    const products = [];

    for (const slug of slugs) {
      const { url, html: productHtml } = await fetchProductPage(slug);
      const product = parseProduct(productHtml, slug, url);
      products.push(product);
    }

    return { success: true, products };

  } catch (err) {
    console.error("[PAYHIP] fetchPayhipCatalog error:", err.message);
    return { success: false, products: [], reason: err.message };
  }
}

/* =========================================================
   6) Sync completo con Airtable (via modules/payhip.cjs)
========================================================= */
async function syncPayhip() {
  console.log("[PAYHIP] sync_start {}");

  const result = await fetchPayhipCatalog();

  if (!result.success || !result.products.length) {
    console.log("[PAYHIP] sync_failed", {
      success: false,
      reason: result.reason || "no_products"
    });
    return { success: false, count: 0, ok: 0, fail: 0, reason: result.reason || "no_products" };
  }

  const products = result.products;
  let ok = 0;
  let fail = 0;

  for (const p of products) {
    try {
      if (canUseAirtable()) {
        await updateFromPayhip(p);
      } else {
        console.log("⏭️ Skip updateFromPayhip: Airtable non configurato");
      }
      ok++;
    } catch (err) {
      fail++;
      console.error("[PAYHIP] error_update_product", p.slug, err.message);
    }
  }

  try {
    if (canUseAirtable()) {
      await removeMissingPayhipProducts(products.map(p => p.slug));
    } else {
      console.log("⏭️ Skip removeMissingPayhipProducts: Airtable non configurato");
    }
  } catch (err) {
    console.error("[PAYHIP] error_remove_missing", err.message);
  }

  console.log("[PAYHIP] sync_success", { success: true, count: ok, ok, fail });
  return { success: true, count: ok, ok, fail };
}

module.exports = {
  syncPayhip,
  fetchPayhipCatalog
};
