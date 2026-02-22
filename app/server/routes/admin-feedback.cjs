// FILE: routes/admin-feedback.cjs

const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/authAdmin.cjs");
const base = require("../lib/airtable.cjs");

router.get("/feedback/lista", authAdmin, async (req, res) => {
  try {
    const records = await base("Feedback").select().all();

    const feedback = records.map(r => ({
      id: r.id,
      utente: r.get("utente"),
      prodotto: r.get("prodotto"),
      rating: r.get("rating"),
      testo: r.get("testo"),
      data: r.get("data"),
      pubblico: r.get("pubblico"),
      risposta_admin: r.get("risposta_admin"),
      segnalato: r.get("segnalato"),
      sentiment: r.get("sentiment"),
      categoria: r.get("categoria_feedback")
    }));

    res.json({ success: true, feedback });

  } catch (err) {
    console.error(err);
    res.json({ success: false, error: "Errore caricamento feedback" });
  }
});

module.exports = router;
