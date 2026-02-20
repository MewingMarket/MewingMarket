/**
 * app/server/routes/sales.cjs
 * Recupero vendite utente
 */

// PATCH: percorso corretto verso airtable.cjs
const { getSalesByUID } = require("../../modules/airtable.cjs");

module.exports = function (app) {
  app.get("/sales/:uid", async (req, res) => {
    const uid = req.params.uid;

    try {
      const sales = await getSalesByUID(uid);

      if (typeof global.logEvent === "function") {
        global.logEvent("sales_fetch", { uid, count: sales?.length || 0 });
      }

      return res.json({ uid, sales });

    } catch (err) {
      console.error("❌ Errore /sales:", err);

      if (typeof global.logEvent === "function") {
        global.logEvent("sales_error", {
          uid,
          error: err?.message || "unknown"
        });
      }

      return res.json({ error: "Errore nel recupero delle vendite" });
    }
  });
};
