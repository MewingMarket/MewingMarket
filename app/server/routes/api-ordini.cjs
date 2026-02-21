const express = require("express");
const router = express.Router();
const { airtable } = require("../services/airtable");

// LISTA ORDINI
router.get("/ordini/lista", async (req, res) => {
  const records = await airtable("Ordini").select().all();

  const ordini = records.map(r => ({
    id: r.id,
    data: r.get("Data"),
    email: r.get("Email"),
    prodotto: r.get("Prodotto"),
    prezzo: r.get("Prezzo"),
    stato: r.get("Stato"),
    metodo: r.get("Metodo")
  }));

  res.json({ success: true, ordini });
});

module.exports = router;
