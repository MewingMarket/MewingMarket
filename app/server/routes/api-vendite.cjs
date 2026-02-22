// =========================================================
// File: app/server/routes/api-vendite.cjs
// Download protetto dei prodotti acquistati
// =========================================================

const express = require("express");
const router = express.Router();

const authUser = require("../middleware/auth-user.cjs");

const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

// =========================================================
// GET /api/vendite/download/:slug
// Protetto da auth-user
// =========================================================
router.get("/vendite/download/:slug", authUser, async (req, res) => {
  try {
    const slug = req.params.slug;
    const email = req.user.email; // da auth-user

    if (!slug) {
      return res.status(400).json({
        success: false,
        error: "Slug mancante"
      });
    }

    // =========================================================
    // 1) CERCA ORDINI COMPLETATI DELL'UTENTE
    // =========================================================
    const records = await base(TABLE)
      .select({
        filterByFormula: `AND({utente} = "${email}", {stato} = "completato")`
      })
      .all();

    if (!records || records.length === 0) {
      return res.status(403).json({
        success: false,
        error: "Nessun ordine completato trovato"
      });
    }

    // =========================================================
    // 2) VERIFICA CHE L'UTENTE ABBIA ACQUISTATO QUESTO PRODOTTO
    // =========================================================
    let prodottoTrovato = null;

    for (const r of records) {
      let prodotti = [];
      try {
        prodotti = JSON.parse(r.get("prodotti") || "[]");
      } catch {}

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

    // =========================================================
    // 3) RECUPERA URL DEL FILE DAL PRODOTTO
    // =========================================================
    if (!prodottoTrovato.fileUrl) {
      return res.status(500).json({
        success: false,
        error: "File non disponibile"
      });
    }

    // =========================================================
    // 4) REDIRECT AL FILE (DOWNLOAD)
    // =========================================================
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
