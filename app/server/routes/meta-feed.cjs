/**
 * =========================================================
 * File: app/server/routes/meta-feed.cjs
 * Feed prodotti per Meta / Facebook / Instagram (JSON mirror)
 * Versione 2026.200 — require assoluti + percorso stabile
 * =========================================================
 */

const fs = require("fs");
const path = require("path");

module.exports = function (app) {
  app.get("/meta/feed", (req, res) => {
    try {
      // PATCH: percorso assoluto e stabile
      const PRODUCTS_JSON = path.join(
        process.cwd(),
        "app/public/data/products.json"
      );

      // Se il JSON non esiste → feed vuoto
      if (!fs.existsSync(PRODUCTS_JSON)) {
        return res.json([]);
      }

      // Legge prodotti dal mirror JSON
      const raw = fs.readFileSync(PRODUCTS_JSON, "utf8");
      const prodotti = JSON.parse(raw);

      // Costruzione feed Meta
      const feed = prodotti.map((p) => ({
        id: p.id,
        title: p.titolo_breve || p.titolo || "",
        description: p.descrizione || "",
        url: `https://mewingmarket.com/prodotto/${p.id}`,
        image_url: p.immagine || "",
        price: (p.prezzo_cent / 100).toFixed(2),
        currency: "EUR",
        availability: "in stock"
      }));

      // Log interno
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
