// =========================================================
// File: app/server/routes/api-ordini-annulla.cjs
// Annulla un ordine dell'utente loggato
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const Airtable = require("airtable").default;
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

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
    if (safeGet(record, "utente") !== email) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    // 3) Controlla stato
    const stato = safeGet(record, "stato");

    if (stato === "completato" || stato === "COMPLETED") {
      return res.json({ success: false, error: "Ordine già completato" });
    }

    if (stato === "annullato" || stato === "CANCELLED") {
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
