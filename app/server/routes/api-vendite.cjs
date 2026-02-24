// =========================================================
// File: app/server/routes/api-vendite.cjs
// Download protetto dei prodotti acquistati
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
// GET /api/vendite/download/:slug
// Protetto da auth-user
// =========================================================
router.get("/vendite/download/:slug", authUser, async (req, res) => {
  try {
    const slug = req.params.slug;
    const email = req.user.email;

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Slug mancante"
      });
    }

    // 1) CERCA ORDINI COMPLETATI DELL'UTENTE
    const records = await base(TABLE)
      .select({
        filterByFormula: `AND({utente} = "${email}", OR({stato} = "completato", {stato} = "COMPLETED"))`
      })
      .all();

    if (!records || records.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Nessun ordine completato trovato"
      });
    }

    // 2) VERIFICA CHE L'UTENTE ABBIA ACQUISTATO QUESTO PRODOTTO
    let prodottoTrovato = null;

    for (const r of records) {
      let prodotti = [];
      try {
        prodotti = JSON.parse(safeGet(r, "prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      const match = prodotti.find(p => p.slug === slug);
      if (match) {
        prodottoTrovato = match;
        break;
      }
    }

    if (!prodottoTrovato) {
      return res.status(403).json({
        success: false,
        error: "Non hai acquistato questo prodotto"
      });
    }

    // 3) RECUPERA URL DEL FILE DAL PRODOTTO
    if (!prodottoTrovato.fileUrl) {
      return res.status(500).json({
        success: false,
        error: "File non disponibile"
      });
    }

    // 4) REDIRECT AL FILE (DOWNLOAD)
    return res.redirect(prodottoTrovato.fileUrl);

  } catch (err) {
    console.error("❌ Errore download:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
