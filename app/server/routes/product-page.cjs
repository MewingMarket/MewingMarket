/**
 * app/server/routes/product-page.cjs
 * Endpoint pagina prodotto
 */

// PRODUCTS → dalla vecchia architettura (airtable.cjs)
const { getProducts } = require("../../../modules/airtable.cjs");

module.exports = function (app) {
  app.get("/prodotto/:slug", async (req, res) => {
    const slug = req.params.slug;

    try {
      const products = Array.isArray(getProducts()) ? getProducts() : [];
      const product = products.find(
        (p) => p.slug === slug || p.id === slug
      );

      if (!product) {
        if (typeof global.logEvent === "function") {
          global.logEvent("product_not_found", { slug });
        }
        return res.status(404).json({ error: "Prodotto non trovato" });
      }

      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_view", { slug });
      }

      return res.json({ product });

    } catch (err) {
      console.error("❌ Errore /prodotto/:slug:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_error", {
          slug,
          error: err?.message || "unknown"
        });
      }

      return res.status(500).json({ error: "Errore caricamento prodotto" });
    }
  });
};
