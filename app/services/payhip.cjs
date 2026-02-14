// app/services/payhip.cjs
// Sync Payhip via scraping HTML (nessuna API)

const axios = require("axios");

// 🔥 PATCH: ora importiamo updateFromPayhip e removeMissingPayhipProducts
// dal modulo CORRETTO: airtable.cjs
const { updateFromPayhip, removeMissingPayhipProducts } = require("../modules/payhip.cjs");

// URL del tuo store Payhip
const PAYHIP_STORE_URL = "https://payhip.com/MewingMarket";

/* =========================================================
   1) Scarica HTML dello store
========================================================= */
async function fetchStoreHtml() {
  try {
    const res = await axios.get(PAYHIP_STORE_URL, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36"
      }
    });

    return res.data || "";
  } catch (err) {
    console.error("[PAYHIP] errore fetchStoreHtml:", err.message);
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
   3) Scarica pagina singolo prodotto
========================================================= */
async function fetchProductPage(slug) {
  try {
    const url = `https://payhip.com/b/${slug}`;
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122.0 Safari/537.36"
      }
    });

    return { url, html: res.data || "" };
  } catch (err) {
    console.error("[PAYHIP] errore fetchProductPage:", slug, err.message);
    return { url: "", html: "" };
  }
}

/* =========================================================
   4) Parsing HTML prodotto
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
   6) Sync completo con Airtable
========================================================= */
async function syncPayhip() {
  console.log("[PAYHIP] sync_start {}");

  const result = await fetchPayhipCatalog();

  if (!result.success || !result.products.length) {
    console.log("[PAYHIP] sync_failed", {
      success: false,
      reason: result.reason || "no_products"
    });
    return { success: false, count: 0, reason: result.reason || "no_products" };
  }

  const products = result.products;
  let ok = 0;

  for (const p of products) {
    try {
      await updateFromPayhip(p); // 🔥 PATCH: ora usa la versione giusta
      ok++;
    } catch (err) {
      console.error("[PAYHIP] error_update_product", p.slug, err.message);
    }
  }

  try {
    await removeMissingPayhipProducts(products.map(p => p.slug));
  } catch (err) {
    console.error("[PAYHIP] error_remove_missing", err.message);
  }

  console.log("[PAYHIP] sync_success", { success: true, count: ok });
  return { success: true, count: ok };
}

module.exports = {
  syncPayhip,
  fetchPayhipCatalog
};
