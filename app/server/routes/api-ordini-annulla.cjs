// =========================================================
// File: app/server/routes/api-ordini-annulla.cjs
// Annulla un ordine dell'utente loggato
// =========================================================

const express = require("express");
const router = express.Router();

const authUser = require("../middleware/auth-user.cjs");

const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// =========================================================
// POST /api/ordini/annulla/:id
// Protetto da auth-user
// =========================================================
router.post("/ordini/annulla/:id", authUser, async (req, res) => {
  try {
    const airtableId = req.params.id;
    const email = req.user.email;

    if (!airtableId) {
      return res.json({ success: false, error: "ID ordine mancante" });
    }

    // 1) Recupera ordine
    let record;
    try {
      record = await base(TABLE).find(airtableId);
    } catch {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // 2) Controlla che appartenga all'utente
    if (record.get("utente") !== email) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    // 3) Controlla stato
    const stato = record.get("stato");
    if (stato === "completato") {
      return res.json({ success: false, error: "Ordine già completato" });
    }
    if (stato === "annullato") {
      return res.json({ success: false, error: "Ordine già annullato" });
    }

    // 4) Aggiorna stato
    await base(TABLE).update(airtableId, {
      stato: "annullato",
      data: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore annulla ordine:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
