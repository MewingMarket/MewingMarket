// =========================================================
// File: app/server/routes/api-vendite.cjs
// Dashboard vendite (Airtable master)
// =========================================================

const express = require("express");
const router = express.Router();
const { airtable } = require("../services/airtable");

router.get("/vendite/lista", async (req, res) => {
  const records = await airtable("Vendite").select().all();

  const vendite = records.map(r => ({
    data: r.get("Data"),
    prodotto: r.get("Prodotto"),
    prezzo: r.get("Prezzo"),
    email: r.get("Email"),
    metodo: r.get("Metodo")
  }));

  const totaleVendite = vendite.length;
  const totaleRicavi = vendite.reduce((sum, v) => sum + (v.prezzo || 0), 0);

  res.json({
    success: true,
    stats: {
      totaleVendite,
      totaleRicavi,
      numeroOrdini: totaleVendite,
      conversione: 2.5
    },
    vendite
  });
});

module.exports = router;
