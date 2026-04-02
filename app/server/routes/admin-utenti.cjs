/* =========================================================
   File: app/server/routes/admin-utenti.cjs
   Admin — Gestione Utenti
   Versione 2026 — EVENTI COMPLETI + NEWSLETTER + BREVO
   PATCH 2026.400 — Admin visibile come “amministratore”,
                    RegistratoBrevo + ClienteBrevo + ClienteDB,
                    Sync Brevo automatica + manuale
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const authAdmin = require("../middleware/auth-admin.cjs");
const fetch = require("node-fetch");
const liste = require("../modules/liste-brevo.cjs");

// Codice fiscale admin
const CF_ADMIN = "GRSSMN92H25I138W";

// =========================================================
// Helper: ultimo evento per tipo
// =========================================================
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

// =========================================================
// Helper: newsletter (subscribe / unsubscribe)
// =========================================================
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

// =========================================================
// Helper: verifica se utente è cliente DB
// =========================================================
function isClienteDB(email) {
  const row = db.prepare(`
    SELECT id FROM ordini
    WHERE email = ?
    LIMIT 1
  `).get(email);

  return row ? "sì" : "no";
}

// =========================================================
// SYNC BREVO (liste 8 e 12)
// =========================================================
async function syncBrevo() {
  const API_KEY = process.env.BREVO_KEY;
  if (!API_KEY) return { newsletter: [], clienti: [] };

  async function getList(listId) {
    const url = `https://api.brevo.com/v3/contacts/lists/${listId}/contacts?limit=500`;
    const res = await fetch(url, {
      headers: { "api-key": API_KEY }
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.contacts || []).map(c => c.email.toLowerCase());
  }

  const newsletter = await getList(liste.LISTA_NEWSLETTER);
  const clienti = await getList(liste.LISTA_CLIENTI);

  return { newsletter, clienti };
}

// =========================================================
// ENDPOINT: SYNC BREVO (manuale + automatica)
// =========================================================
router.get("/utenti/sync-brevo", authAdmin, async (req, res) => {
  try {
    const data = await syncBrevo();
    res.json({ success: true, ...data });
  } catch (err) {
    console.error("Errore sync Brevo:", err);
    res.json({ success: false, error: "Errore sync Brevo" });
  }
});

// =========================================================
// LISTA UTENTI COMPLETA (admin incluso come “amministratore”)
// =========================================================
router.get("/utenti/lista", authAdmin, async (req, res) => {
  try {
    // Sync Brevo automatica (fallback se fallisce)
    let brevo = { newsletter: [], clienti: [] };
    try {
      brevo = await syncBrevo();
    } catch {}

    const utenti = db.prepare(`
      SELECT email, codice_fiscale,
             CASE WHEN codice_fiscale = ? THEN 1 ELSE 0 END AS is_admin
      FROM utenti
      ORDER BY email ASC
    `).all(CF_ADMIN);

    const output = utenti.map(u => {
      const emailLower = u.email.toLowerCase();

      return {
        email: u.is_admin ? "amministratore" : u.email,
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
        disiscritto: getNewsletterEvent(u.email, "unsubscribe"),

        // ⭐ BREVO
        registrato_brevo: brevo.newsletter.includes(emailLower)
          ? "presente"
          : "—",

        cliente_brevo: brevo.clienti.includes(emailLower)
          ? "presente"
          : "—",

        // ⭐ CLIENTE DB
        cliente_db: isClienteDB(u.email)
      };
    });

    res.json({ success: true, utenti: output });

  } catch (err) {
    console.error("Errore lista utenti:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

// ==========================================================
// BLOCCA UTENTE
// ==========================================================
router.post("/utenti/blocca", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email || email === "amministratore")
    return res.json({ success: false });

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'bloccato', datetime('now'))
  `).run(email);

  res.json({ success: true });
});

// ==========================================================
// SBLOCCA UTENTE
// ==========================================================
router.post("/utenti/sblocca", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email || email === "amministratore")
    return res.json({ success: false });

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'sbloccato', datetime('now'))
  `).run(email);

  res.json({ success: true });
});

// ==========================================================
// ELIMINA UTENTE
// ==========================================================
router.post("/utenti/elimina", authAdmin, (req, res) => {
  const { email } = req.body;
  if (!email || email === "amministratore")
    return res.json({ success: false });

  db.prepare(`DELETE FROM utenti WHERE email = ?`).run(email);
  db.prepare(`DELETE FROM utenti_eventi WHERE email = ?`).run(email);
  db.prepare(`DELETE FROM newsletter_log WHERE email = ?`).run(email);

  res.json({ success: true });
});

module.exports = router;
