// =========================================================
// File: app/server/api-prodotti.cjs
// API prodotti: catalogo + singolo prodotto
// =========================================================

const {
  getAllProducts,
  getProductBySlug
} = require("../modules/prodotti.cjs");

module.exports = function (app) {

  // Tutti i prodotti (con filtri opzionali)
  app.get("/api/products", async (req, res) => {
    try {
      const categoria = req.query.categoria || null;

      let products = await getAllProducts();

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
      const product = await getProductBySlug(slug);

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
