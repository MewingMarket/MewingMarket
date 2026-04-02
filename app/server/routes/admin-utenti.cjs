/* =========================================================
   File: app/server/routes/admin-utenti.cjs
   Admin — Gestione Utenti
   Versione 2026 — EVENTI COMPLETI + NEWSLETTER
   PATCH 2026.300 — Admin escluso, registrato=Sì, blocca/sblocca/elimina
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const authAdmin = require("../middleware/auth-admin.cjs");

// Codice fiscale admin (da escludere dalla lista utenti)
const CF_ADMIN = "GRSSMN92H25I138W";

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
// LISTA UTENTI COMPLETA (admin escluso)
// ---------------------------------------------------------
router.get("/utenti/lista", authAdmin, (req, res) => {
  try {
    const utenti = db.prepare(`
      SELECT email, codice_fiscale
      FROM utenti
      WHERE codice_fiscale != ?
      ORDER BY email ASC
    `).all(CF_ADMIN);

    const output = utenti.map(u => ({
      email: u.email,
      codice_fiscale: u.codice_fiscale,

      // EVENTI UTENTE
      registrato: getLastEvent(u.email, "registrato") || "Sì",
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

// ---------------------------------------------------------
// BLOCCA UTENTE
// ---------------------------------------------------------
router.post("/utenti/blocca", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, error: "Email mancante" });

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'bloccato', datetime('now'))
  `).run(email);

  res.json({ success: true });
});

// ---------------------------------------------------------
// SBLOCCA UTENTE
// ---------------------------------------------------------
router.post("/utenti/sblocca", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, error: "Email mancante" });

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'sbloccato', datetime('now'))
  `).run(email);

  res.json({ success: true });
});

// ---------------------------------------------------------
// ELIMINA UTENTE (completo: utenti + eventi + newsletter)
// ---------------------------------------------------------
router.post("/utenti/elimina", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, error: "Email mancante" });

  db.prepare(`DELETE FROM utenti WHERE email = ?`).run(email);
  db.prepare(`DELETE FROM utenti_eventi WHERE email = ?`).run(email);
  db.prepare(`DELETE FROM newsletter_log WHERE email = ?`).run(email);

  res.json({ success: true });
});

// ---------------------------------------------------------
// SYNC NEWSLETTER (placeholder — da collegare a Brevo)
// ---------------------------------------------------------
router.get("/newsletter/sync", authAdmin, (req, res) => {
  // Qui in futuro collegheremo l’API Brevo
  res.json({ success: true, message: "Sync pronto (da collegare a Brevo)" });
});

module.exports = router;
