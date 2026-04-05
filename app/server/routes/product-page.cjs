/**
 * =========================================================
 * File: app/server/routes/product-page.cjs
 * Endpoint pagina prodotto (serve solo l'HTML)
 * =========================================================
 */

const path = require("path");

module.exports = function (app) {

  // Serve la pagina prodotto statica
  app.get("/prodotto/:id", (req, res) => {
    try {
      res.sendFile("prodotto.html", {
        root: path.join(__dirname, "../../public")
      });

      // Tracking opzionale
      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_view", { id: req.params.id });
      }

    } catch (err) {
      console.error("❌ Errore /prodotto/:id:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("product_page_error", {
          id: req.params.id,
          error: err?.message || "unknown"
        });
      }

      res.status(500).send("Errore caricamento pagina prodotto");
    }
  });

};
