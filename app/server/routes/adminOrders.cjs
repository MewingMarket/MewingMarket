const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/ordini/lista", authAdmin, async (req, res) => {
  try {
    const records = await base(process.env.AIRTABLE_SALES)
      .select({ sort: [{ field: "Timestamp", direction: "desc" }] })
      .all();

    const ordini = records.map(r => ({
      id: r.id,
      prodotto: r.get("Prodotto"),
      prezzo: r.get("Prezzo"),
      stato: r.get("Stato") || "completato",
      email: r.get("Email"),
      origine: r.get("Origine") || "—",
      data: r.get("Timestamp")
    }));

    res.json({
      success: true,
      stats: {
        totali: ordini.length,
        completati: ordini.filter(o => o.stato === "completato").length,
        abbandonati: ordini.filter(o => o.stato === "abbandonato").length
      },
      ordini
    });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento ordini" });
  }
});

module.exports = router;
