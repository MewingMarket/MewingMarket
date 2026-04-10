/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — DEBUG SUPREMO + FALLBACK
   Versione 2026.200 — require assoluti
========================================================= */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const router = express.Router();
const db = R("db/database.cjs");

/* =========================================================
   1) ROTTA PRINCIPALE: FEEDBACK LISTA + DEBUG SUPREMO
========================================================= */
router.get("/feedback/lista", (req, res) => {
  try {
    console.log("🔵 [ADMIN] GET /admin/feedback/lista chiamato");

    const stmt = db.prepare(`
      SELECT 
        f.id,
        f.rating,
        f.commento,
        f.data,
        f.prodotto_id,
        f.utente_id,
        p.titolo_breve AS prodotto_titolo,
        u.email AS utente_email
      FROM feedback f
      LEFT JOIN utenti u ON u.id = f.utente_id
      LEFT JOIN prodotti p ON p.id = f.prodotto_id
      ORDER BY f.id DESC
    `);

    const lista = stmt.all();

    console.log("🔵 [ADMIN] Feedback trovati:", lista.length);
    lista.forEach((f, i) => {
      console.log(`   [${i}]`, {
        id: f.id,
        rating: f.rating,
        commento: f.commento,
        prodotto_id: f.prodotto_id,
        utente_id: f.utente_id,
        prodotto_titolo: f.prodotto_titolo,
        utente_email: f.utente_email
      });
    });

    const ordini = db.prepare(`
      SELECT id, utente_id, prodotti_json
      FROM ordini
    `).all();

    console.log("🔵 [ADMIN] Ordini trovati:", ordini.length);

    const output = lista.map((f, idx) => {
      let email = f.utente_email;

      console.log(`🟡 [MAP] Feedback #${idx} prima del fallback`, {
        id: f.id,
        prodotto_id: f.prodotto_id,
        utente_id: f.utente_id,
        utente_email: f.utente_email
      });

      if (email) {
        console.log(`   ✅ Email diretta trovata per feedback #${idx}:`, email);
        return { ...f, utente_email: email };
      }

      for (const o of ordini) {
        try {
          const prodotti = JSON.parse(o.prodotti_json);
          if (Array.isArray(prodotti)) {
            const match = prodotti.find(p => p.prodotto_id === f.prodotto_id);
            if (match) {
              console.log(`   🟢 Match ordine trovato per feedback #${idx}:`, {
                ordine_id: o.id,
                ordine_utente_id: o.utente_id,
                prodotto_id: f.prodotto_id
              });

              const u = db.prepare(`SELECT email FROM utenti WHERE id = ?`).get(o.utente_id);
              if (u && u.email) {
                console.log(`   ✅ Email da ordini per feedback #${idx}:`, u.email);
                return { ...f, utente_email: u.email };
              } else {
                console.log(`   ⚠ Nessuna email trovata in utenti per utente_id`, o.utente_id);
              }
            }
          }
        } catch (e) {
          console.error("   ❌ Errore parse prodotti_json ordine", o.id, e);
        }
      }

      console.log(`   ⚪ Nessun utente trovato per feedback #${idx} → Anonimo`);
      return { ...f, utente_email: "Anonimo" };
    });

    /* =========================================================
       PATCH KPI FEEDBACK — STATISTICHE PER ADMIN
    ========================================================== */

    const kpi = {
      totale: output.length,
      media_stelle: 0,
      percentuali: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      prodotti_top: [],
      prodotti_flop: []
    };

    if (output.length > 0) {
      kpi.media_stelle = (
        output.reduce((sum, f) => sum + Number(f.rating), 0) / output.length
      ).toFixed(2);

      output.forEach(f => {
        const r = Number(f.rating);
        if (kpi.percentuali[r] !== undefined) {
          kpi.percentuali[r]++;
        }
      });

      Object.keys(kpi.percentuali).forEach(k => {
        kpi.percentuali[k] = ((kpi.percentuali[k] / output.length) * 100).toFixed(1);
      });

      const mapProdotti = {};

      output.forEach(f => {
        if (!mapProdotti[f.prodotto_id]) {
          mapProdotti[f.prodotto_id] = {
            prodotto_id: f.prodotto_id,
            titolo: f.prodotto_titolo,
            count: 0,
            somma: 0
          };
        }
        mapProdotti[f.prodotto_id].count++;
        mapProdotti[f.prodotto_id].somma += Number(f.rating);
      });

      const arr = Object.values(mapProdotti).map(p => ({
        ...p,
        media: (p.somma / p.count).toFixed(2)
      }));

      kpi.prodotti_top = arr.sort((a, b) => b.media - a.media).slice(0, 5);
      kpi.prodotti_flop = arr.sort((a, b) => a.media - b.media).slice(0, 5);
    }

    console.log("🟣 [ADMIN] KPI Feedback:", kpi);

    return res.json({
      success: true,
      feedback: output,
      kpi
    });

  } catch (err) {
    console.error("❌ [ADMIN] Errore /admin/feedback/lista:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   2) ROTTA DEBUG GREZZO DB
========================================================= */
router.get("/feedback/debug-db", (req, res) => {
  try {
    console.log("🔍 [ADMIN] DEBUG-DB chiamato");

    const feedback = db.prepare(`SELECT * FROM feedback`).all();
    const ordini = db.prepare(`SELECT * FROM ordini`).all();
    const prodotti = db.prepare(`SELECT * FROM prodotti`).all();
    const utenti = db.prepare(`SELECT * FROM utenti`).all();

    return res.json({
      success: true,
      feedback,
      ordini,
      prodotti,
      utenti
    });
  } catch (err) {
    console.error("❌ [ADMIN] Errore /admin/feedback/debug-db:", err);
    return res.json({ success: false, error: "Errore debug-db" });
  }
});

/* =========================================================
   3) EXPORT
========================================================= */
module.exports = router;
