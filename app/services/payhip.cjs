// app/services/payhip.cjs — VERSIONE DEFINITIVA (NO ROUTER, NO CIRCULAR)

const path = require("path");
const axios = require("axios");
const fs = require("fs");

// Import moduli interni SENZA richiedere server.cjs
const {
  updateFromPayhip,
  loadProducts
} = require(path.join(__dirname, "..", "modules", "airtable.cjs"));

/* =========================================================
   LOG LOCALE (non dipende dal server)
========================================================= */
function logLocal(event, data = {}) {
  try {
    console.log(`[PAYHIP] ${event}`, data);
  } catch {
    // ignora
  }
}

/* =========================================================
   FETCH CATALOGO PAYHIP
========================================================= */
async function fetchPayhipCatalog() {
  try {
    const API_KEY = process.env.PAYHIP_API_KEY;

    if (!API_KEY) {
      logLocal("missing_api_key", {});
      return { success: false, products: [], reason: "PAYHIP_API_KEY mancante" };
    }

    const res = await axios.get("https://payhip.com/api/v1/products", {
      headers: {
        Authorization: `Bearer ${API_KEY}`
      }
    });

    const items = res.data?.products || [];

    logLocal("catalog_fetched", { count: items.length });

    const mapped = items.map(p => ({
      id: p.id,
      title: p.name,
      price: p.price,
      description: p.description || "",
      image: p.thumbnail || "",
      url: p.url || "",
      slug: p.slug || p.id
    }));

    return { success: true, products: mapped };

  } catch (err) {
    console.error("❌ Errore fetchPayhipCatalog:", err?.response?.data || err);
    return {
      success: false,
      products: [],
      reason: err?.response?.data?.message || err?.message || "unknown"
    };
  }
}

/* =========================================================
   SYNC PAYHIP → AIRTABLE → products.json
========================================================= */
async function syncPayhip() {
  logLocal("sync_start", {});

  const result = await fetchPayhipCatalog();

  if (!result.success || result.products.length === 0) {
    logLocal("sync_failed", {
      success: result.success,
      reason: result.reason
    });

    return {
      success: false,
      count: 0,
      reason: result.reason || "Nessun prodotto da sincronizzare"
    };
  }

  const products = result.products;
  let ok = 0;
  let fail = 0;

  for (const item of products) {
    try {
      await updateFromPayhip(item);
      ok++;
    } catch (err) {
      fail++;
      console.error("Errore updateFromPayhip:", err);
      logLocal("update_item_error", {
        slug: item.slug,
        error: err?.message || "unknown"
      });
    }
  }

  try {
    loadProducts();
  } catch (err) {
    console.error("Errore loadProducts dopo sync Payhip:", err);
    logLocal("load_products_error", { error: err?.message || "unknown" });
  }

  logLocal("sync_complete", { ok, fail, total: products.length });

  return {
    success: true,
    ok,
    fail,
    count: products.length
  };
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  syncPayhip
};
