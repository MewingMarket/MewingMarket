const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/vendite/lista", authAdmin, async (req, res) => {
  try {
    const records = await base(process.env.AIRTABLE_SALES)
      .select({ sort: [{ field: "Timestamp", direction: "desc" }] })
      .all();

    const vendite = records.map(r => ({
      data: r.get("Timestamp"),
      prodotto: r.get("Prodotto"),
      prezzo: r.get("Prezzo"),
      email: r.get("Email"),
      metodo: r.get("Metodo") || "—"
    }));

    const totaleRicavi = vendite.reduce((s, v) => s + Number(v.prezzo || 0), 0);

    res.json({
      success: true,
      stats: {
        totaleVendite: vendite.length,
        totaleRicavi,
        numeroOrdini: vendite.length,
        conversione: 3.2 // placeholder
      },
      vendite
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento vendite" });
  }
});

module.exports = router;
