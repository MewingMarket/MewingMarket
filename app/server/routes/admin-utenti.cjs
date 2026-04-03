/* =========================================================
   File: app/server/routes/admin-utenti.cjs
   Admin — Gestione Utenti
   Versione 2026 — EVENTI COMPLETI + NEWSLETTER + BREVO
   PATCH 2026.600 — Fix ClienteDB (utente_id),
                    Admin sentinella,
                    RegistratoBrevo + ClienteBrevo + ClienteDB,
                    Sync Brevo automatica + manuale,
                    Eliminazione utente con FK + Brevo liste
========================================================= */

const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");
const authAdmin = require("../middleware/auth-admin.cjs");
const fetch = require("node-fetch");

// ⭐ PATCH: importiamo router Brevo centralizzato
const brevo = require("../modules/liste-brevo.cjs");

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
// Helper: verifica se utente è cliente DB (ordini.utente_id)
// =========================================================
function isClienteDB(email) {
  const user = db.prepare(`SELECT id FROM utenti WHERE email = ?`).get(email);
  if (!user) return "no";

  const row = db.prepare(`
    SELECT id FROM ordini
    WHERE utente_id = ?
    LIMIT 1
  `).get(user.id);

  return row ? "sì" : "no";
}

// =========================================================
// ⭐ PATCH: SYNC BREVO (usa router centralizzato)
// =========================================================
async function syncBrevo() {
  try {
    const res = await brevo.syncLists();
    return {
      newsletter: Array.isArray(res?.newsletter) ? res.newsletter : [],
      clienti: Array.isArray(res?.clienti) ? res.clienti : []
    };
  } catch (err) {
    console.error("Errore syncBrevo:", err);
    return { newsletter: [], clienti: [] };
  }
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
    // ⭐ PATCH: Sync Brevo automatica tramite router centralizzato
    let brevoLists = { newsletter: [], clienti: [] };
    try {
      brevoLists = await syncBrevo();
    } catch (err) {
      console.error("Errore syncBrevo in /utenti/lista:", err);
      brevoLists = { newsletter: [], clienti: [] };
    }

    const utenti = db.prepare(`
      SELECT email, codice_fiscale,
             CASE WHEN codice_fiscale = ? THEN 1 ELSE 0 END AS is_admin
      FROM utenti
      ORDER BY email ASC
    `).all(CF_ADMIN);

    const output = utenti.map(u => {
      const emailLower = (u.email || "").toLowerCase();

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

        // NEWSLETTER (log locale)
        iscritto: getNewsletterEvent(u.email, "subscribe"),
        disiscritto: getNewsletterEvent(u.email, "unsubscribe"),

        // ⭐ BREVO (router centralizzato)
        registrato_brevo: brevoLists.newsletter.includes(emailLower)
          ? "presente"
          : "—",

        cliente_brevo: brevoLists.clienti.includes(emailLower)
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
// ELIMINA UTENTE (DB + eventi + newsletter_log + Brevo liste)
// ==========================================================
router.post("/utenti/elimina", authAdmin, async (req, res) => {
  const { email } = req.body;
  if (!email || email === "amministratore")
    return res.json({ success: false });

  try {
    // 1) Trova utente per id (per FK ordini.utente_id)
    const user = db.prepare(`
      SELECT id FROM utenti WHERE email = ?
    `).get(email);

    if (!user) {
      // già eliminato lato DB, ma puliamo comunque Brevo
      try {
        await brevo.removeFromList(brevo.LISTA_NEWSLETTER, email);
        await brevo.removeFromList(brevo.LISTA_CLIENTI, email);
      } catch (err) {
        console.error("❌ Errore rimozione Brevo (utente inesistente):", err);
      }
      return res.json({ success: true });
    }

    // 2) Elimina ordini collegati (FK)
    db.prepare(`DELETE FROM ordini WHERE utente_id = ?`).run(user.id);

    // 3) Elimina eventi utente
    db.prepare(`DELETE FROM utenti_eventi WHERE email = ?`).run(email);

    // 4) Elimina log newsletter locali
    db.prepare(`DELETE FROM newsletter_log WHERE email = ?`).run(email);

    // 5) Elimina utente
    db.prepare(`DELETE FROM utenti WHERE id = ?`).run(user.id);

    // ⭐ PATCH BREVO — rimozione da entrambe le liste
    try {
      await brevo.removeFromList(brevo.LISTA_NEWSLETTER, email);
      await brevo.removeFromList(brevo.LISTA_CLIENTI, email);
    } catch (err) {
      console.error("❌ Errore rimozione Brevo:", err);
    }

    res.json({ success: true });

  } catch (err) {
    console.error("Errore elimina utente:", err);
    res.json({ success: false, error: "Errore eliminazione utente" });
  }
});

module.exports = router;
