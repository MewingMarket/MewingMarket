// =========================================================
// File: app/server/routes/api-feedback.cjs
// Sistema recensioni utenti — Versione definitiva
// Airtable nuova SDK + auth-user + struttura reale
// =========================================================

const express = require("express");
const Airtable = require("../lib/airtable-wrapper.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE_FEEDBACK = "Feedback";
const TABLE_ORDINI = "Ordini";

// Helper sicuro
function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// =========================================================
// GET /api/recensioni/utente
// Restituisce tutte le recensioni dell’utente loggato
// =========================================================
router.get("/recensioni/utente", authUser, async (req, res) => {
  try {
    const email = req.user.email;

    const records = await base(TABLE_FEEDBACK)
      .select({
        filterByFormula: `{utente} = "${email}"`,
        sort: [{ field: "data", direction: "desc" }]
      })
      .all();

    const recensioni = records.map(r => ({
      id: r.id,
      prodotto_slug: safeGet(r, "prodotto_slug"),
      prodotto_titolo: safeGet(r, "prodotto_titolo"),
      rating: safeGet(r, "rating"),
      commento: safeGet(r, "commento"),
      data: safeGet(r, "data") || r._rawJson.createdTime
    }));

    return res.json({ success: true, recensioni });

  } catch (err) {
    console.error("❌ Errore GET /recensioni/utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/recensioni/crea
// Crea una nuova recensione (solo se l’utente ha acquistato)
// =========================================================
router.post("/recensioni/crea", authUser, async (req, res) => {
  try {
    const email = req.user.email;
    const { slug, titolo, rating, commento } = req.body;

    if (!slug || !rating || !commento) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // 1) Verifica che l’utente abbia acquistato il prodotto
    const ordini = await base(TABLE_ORDINI)
      .select({
        filterByFormula: `{utente} = "${email}"`
      })
      .all();

    let haAcquistato = false;

    for (const r of ordini) {
      let prodotti = [];
      try {
        prodotti = JSON.parse(safeGet(r, "prodotti") || "[]");
      } catch {
        prodotti = [];
      }

      if (prodotti.some(p => p.slug === slug)) {
        haAcquistato = true;
        break;
      }
    }

    if (!haAcquistato) {
      return res.json({ success: false, error: "Non hai acquistato questo prodotto" });
    }

    // 2) Crea recensione
    await base(TABLE_FEEDBACK).create({
      utente: email,
      prodotto_slug: slug,
      prodotto_titolo: titolo,
      rating: Number(rating),
      commento,
      data: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore POST /recensioni/crea:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// POST /api/recensioni/modifica
// Modifica una recensione esistente dell’utente
// =========================================================
router.post("/recensioni/modifica", authUser, async (req, res) => {
  try {
    const email = req.user.email;
    const { id, rating, commento } = req.body;

    if (!id || !rating || !commento) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // 1) Recupera recensione
    let record;
    try {
      record = await base(TABLE_FEEDBACK).find(id);
    } catch {
      return res.json({ success: false, error: "Recensione non trovata" });
    }

    // 2) Verifica che appartenga all’utente
    if (safeGet(record, "utente") !== email) {
      return res.json({ success: false, error: "Non autorizzato" });
    }

    // 3) Aggiorna
    await base(TABLE_FEEDBACK).update(id, {
      rating: Number(rating),
      commento,
      data: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore POST /recensioni/modifica:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
