/* =========================================================
   FILE: app/server/routes/meta-feed.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Feed prodotti per Meta / Facebook / Instagram
========================================================= */

const fs = require("fs");
const path = require("path");

/* =========================================================
   FUNZIONE PRINCIPALE — metaFeed
========================================================= */
async function metaFeed() {
  console.log("[DEBUG meta-feed] metaFeed() chiamato");

  try {
    const PRODUCTS_JSON = path.join(
      process.cwd(),
      "app/public/data/products.json"
    );

    if (!fs.existsSync(PRODUCTS_JSON)) {
      console.log("[DEBUG meta-feed] products.json non trovato → feed vuoto");
      return { success: true, feed: [] };
    }

    const raw = fs.readFileSync(PRODUCTS_JSON, "utf8");
    const prodotti = JSON.parse(raw);

    const feed = prodotti.map((p) => ({
      id: p.id,
      title: p.titolo_breve || p.titolo || "",
      description: p.descrizione || "",
      url: `https://mewingmarket.it/prodotto/${p.id}`,
      image_url: p.immagine || "",
      price: (p.prezzo_cent / 100).toFixed(2),
      currency: "EUR",
      availability: "in stock"
    }));

    if (typeof global.logEvent === "function") {
      global.logEvent("meta_feed_generated", { count: feed.length });
    }

    return {
      success: true,
      feed
    };

  } catch (err) {
    console.error("❌ Errore metaFeed:", err);

    if (typeof global.logEvent === "function") {
      global.logEvent("meta_feed_error", {
        error: err?.message || "unknown"
      });
    }

    return {
      success: false,
      error: "Errore generazione feed Meta"
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
   (ex GET /meta/feed)
========================================================= */
async function feed(req) {
  console.log("[DEBUG meta-feed] alias feed() → metaFeed()");
  return metaFeed(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  metaFeed,
  feed
};
