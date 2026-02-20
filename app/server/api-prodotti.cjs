// =========================================================
// File: app/server/api-prodotti.cjs
// API prodotti: catalogo + singolo prodotto
// Versione patchata per airtable.cjs
// =========================================================

const {
  getProducts
} = require("../modules/airtable.cjs");

module.exports = function (app) {

  // Tutti i prodotti (con filtri opzionali)
  app.get("/api/products", async (req, res) => {
    try {
      const categoria = req.query.categoria || null;

      let products = Array.isArray(getProducts()) ? getProducts() : [];

      if (categoria) {
        products = products.filter(p => p.categoria === categoria);
      }

      res.json({ success: true, products });

    } catch (err) {
      console.error("❌ /api/products error:", err);
      res.status(500).json({ success: false, error: "server_error" });
    }
  });

  // Singolo prodotto
  app.get("/api/products/:slug", async (req, res) => {
    try {
      const slug = req.params.slug;

      const products = Array.isArray(getProducts()) ? getProducts() : [];
      const product = products.find(p => p.slug === slug);

      if (!product) {
        return res.json({ success: false, error: "not_found" });
      }

      res.json({ success: true, product });

    } catch (err) {
      console.error("❌ /api/products/:slug error:", err);
      res.status(500).json({ success: false, error: "server_error" });
    }
  });

};
