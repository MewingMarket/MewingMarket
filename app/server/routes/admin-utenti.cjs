/* =========================================================
   File: app/server/routes/admin-utenti.cjs
   Admin — Gestione Utenti
   Versione 2026 — PATCH EVENTI COMPLETI
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const { requireAdmin } = require("../middleware/require-admin.cjs");

// ---------------------------------------------------------
// Helper: ultimo evento per tipo
// ---------------------------------------------------------
function getLastEvent(email, evento) {
  const row = db.prepare(`
    SELECT data 
    FROM utenti_eventi
    WHERE email = ? AND evento = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(email, evento);

  return row ? row.data : "";
}

// ---------------------------------------------------------
// Helper: newsletter (subscribe / unsubscribe)
// ---------------------------------------------------------
function getNewsletterEvent(email, tipo) {
  const row = db.prepare(`
    SELECT data
    FROM newsletter_log
    WHERE email = ? AND azione = ?
    ORDER BY id DESC
    LIMIT 1
  `).get(email, tipo);

  return row ? row.data : "";
}

// ---------------------------------------------------------
// LISTA UTENTI COMPLETA
// ---------------------------------------------------------
router.get("/utenti/lista", requireAdmin, (req, res) => {
  try {
    const utenti = db.prepare(`
      SELECT email, codice_fiscale
      FROM utenti
      ORDER BY email ASC
    `).all();

    const output = utenti.map(u => ({
      email: u.email,
      codice_fiscale: u.codice_fiscale,

      // EVENTI UTENTE
      registrato: getLastEvent(u.email, "registrato"),
      login: getLastEvent(u.email, "login"),
      logout: getLastEvent(u.email, "logout"),
      eliminato: getLastEvent(u.email, "eliminato"),
      bloccato: getLastEvent(u.email, "bloccato"),
      sbloccato: getLastEvent(u.email, "sbloccato"),

      // NEWSLETTER
      iscritto: getNewsletterEvent(u.email, "subscribe"),
      disiscritto: getNewsletterEvent(u.email, "unsubscribe")
    }));

    res.json({ success: true, utenti: output });

  } catch (err) {
    console.error("Errore lista utenti:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

module.exports = router;
