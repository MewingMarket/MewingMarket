/* =========================================================
   File: app/server/routes/admin-feedback.cjs
   Lista completa feedback per Admin — DEBUG SUPREMO + FALLBACK
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

/* =========================================================
   1) ROTTA PRINCIPALE: FEEDBACK LISTA + DEBUG SUPREMO
========================================================= */
router.get("/feedback/lista", (req, res) => {
  try {
    console.log("🔵 [ADMIN] GET /admin/feedback/lista chiamato");

    // Query base
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

    // Carichiamo tutti gli ordini per fallback
    const ordini = db.prepare(`
      SELECT id, utente_id, prodotti_json
      FROM ordini
    `).all();

    console.log("🔵 [ADMIN] Ordini trovati:", ordini.length);
    ordini.forEach((o, i) => {
      console.log(`   [ORDINE ${i}]`, {
        id: o.id,
        utente_id: o.utente_id,
        prodotti_json: o.prodotti_json
      });
    });

    // MAP + FALLBACK
    const output = lista.map((f, idx) => {
      let email = f.utente_email;

      console.log(`🟡 [MAP] Feedback #${idx} prima del fallback`, {
        id: f.id,
        prodotto_id: f.prodotto_id,
        utente_id: f.utente_id,
        utente_email: f.utente_email
      });

      // 1) Email diretta
      if (email) {
        console.log(`   ✅ Email diretta trovata per feedback #${idx}:`, email);
        return { ...f, utente_email: email };
      }

      // 2) Fallback ordini (JSON)
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

      // 3) Fallback finale
      console.log(`   ⚪ Nessun utente trovato per feedback #${idx} → Anonimo`);
      return { ...f, utente_email: "Anonimo" };
    });

    console.log("🟣 [ADMIN] Output finale inviato al frontend. Righe:", output.length);

    return res.json({ success: true, feedback: output });

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

    console.log("   📦 feedback:", feedback);
    console.log("   📦 ordini:", ordini);
    console.log("   📦 prodotti:", prodotti);
    console.log("   📦 utenti:", utenti);

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
