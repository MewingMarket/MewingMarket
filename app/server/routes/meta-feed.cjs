/**
 * =========================================================
 * File: app/server/routes/meta-feed.cjs
 * Feed prodotti per Meta / Facebook / Instagram (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

module.exports = function (app) {
  app.get("/meta/feed", (req, res) => {
    try {
      // Recupera prodotti dal DB
      const stmt = db.prepare(`
        SELECT 
          id,
          slug,
          titolo_breve,
          descrizione,
          immagine,
          prezzo_cent
        FROM prodotti
        ORDER BY id DESC
      `);

      const prodotti = stmt.all();

      // Costruzione feed Meta
      const feed = prodotti.map((p) => ({
        id: p.id,
        title: p.titolo_breve || "",
        description: p.descrizione || "",
        url: `https://mewingmarket.com/prodotto/${p.slug}`,
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
