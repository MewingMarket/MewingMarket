/**
 * =========================================================
 * File: app/server/routes/product-page.cjs
 * Endpoint pagina prodotto (serve solo l'HTML)
 * =========================================================
 */

const path = require("path");

module.exports = function (app) {

  // Serve la pagina prodotto statica
  app.get("/prodotto/:slug", (req, res) => {
    try {
      res.sendFile("prodotto.html", {
        root: path.join(__dirname, "../../public")
      });

      // Tracking opzionale
      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_view", { slug: req.params.slug });
      }

    } catch (err) {
      console.error("❌ Errore /prodotto/:slug:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_error", {
          slug: req.params.slug,
          error: err?.message || "unknown"
        });
      }

      res.status(500).send("Errore caricamento pagina prodotto");
    }
  });

};
