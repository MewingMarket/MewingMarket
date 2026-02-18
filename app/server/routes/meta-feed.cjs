/**
 * app/server/routes/meta-feed.cjs
 * Feed prodotti per Meta / Facebook / Instagram
 */

// PRODUCTS → percorso corretto
const { getProducts } = require("../../modules/products.cjs");

module.exports = function (app) {
  app.get("/meta/feed", async (req, res) => {
    try {
      const products = Array.isArray(getProducts()) ? getProducts() : [];

      const feed = products.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        url: `https://mewingmarket.com/prodotto/${p.slug || p.id}`,
        image_url: p.image,
        price: p.price,
        currency: "EUR",
        availability: "in stock"
      }));

      if (typeof global.logEvent === "function") {
        global.logEvent("meta_feed_generated", { count: feed.length });
      }

      res.header("Content-Type", "application/json");
      return res.json(feed);

    } catch (err) {
      console.error("❌ Errore /meta/feed:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("meta_feed_error", {
          error: err?.message || "unknown"
        });
      }

      return res.status(500).json({ error: "Errore generazione feed Meta" });
    }
  });
};
