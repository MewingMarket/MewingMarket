/* =========================================================
   FILE: app/server/routes/admin-utenti.cjs
   MODALITÀ: Java‑mode (NO Express)
   Admin — Gestione Utenti
   Versione 2027.100 — compatibile router universale
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authAdmin = R("middleware/auth-admin.cjs");
const fetch = require("node-fetch");

const {
  syncBrevoUtenteStatoReale,
  LISTA_NEWSLETTER,
  LISTA_REGISTRATI,
  LISTA_CLIENTI
} = R("modules/liste-brevo.cjs");

const { inviaEmailNewsletterUnsubscribe } = R("modules/email-newsletter-unsubscribe.cjs");

const CF_ADMIN = "GRSSMN92H25I138W";

/* =========================================================
   HELPERS
========================================================= */
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

/* =========================================================
   SYNC BREVO COMPLETO
========================================================= */
async function syncBrevo() {
  console.log("[DEBUG admin-utenti] syncBrevo()");

  try {
    const apiKey = process.env.BREVO_API_KEY;

    const resNL = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${LISTA_NEWSLETTER}/contacts`,
      { headers: { "api-key": apiKey } }
    ).then(r => r.json());

    const resREG = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${LISTA_REGISTRATI}/contacts`,
      { headers: { "api-key": apiKey } }
    ).then(r => r.json());

    const resCL = await fetch(
      `https://api.brevo.com/v3/contacts/lists/${LISTA_CLIENTI}/contacts`,
      { headers: { "api-key": apiKey } }
    ).then(r => r.json());

    return {
      newsletter: (resNL.contacts || []).map(c => c.email.toLowerCase()),
      registrati: (resREG.contacts || []).map(c => c.email.toLowerCase()),
      clienti: (resCL.contacts || []).map(c => c.email.toLowerCase())
    };

  } catch (err) {
    console.error("Errore syncBrevo:", err);
    return { newsletter: [], registrati: [], clienti: [] };
  }
}

/* =========================================================
   ENDPOINT: syncBrevoManuale
========================================================= */
async function syncBrevoManuale(req) {
  console.log("[DEBUG admin-utenti] syncBrevoManuale()");
  return { success: true, ...(await syncBrevo()) };
}

/* =========================================================
   ENDPOINT: syncBrevoFull
========================================================= */
async function syncBrevoFull(req) {
  console.log("[DEBUG admin-utenti] syncBrevoFull()");

  try {
    const utenti = db.prepare(`
      SELECT email FROM utenti
      ORDER BY id ASC
    `).all();

    for (const u of utenti) {
      const email = (u.email || "").trim().toLowerCase();
      if (!email) continue;

      await syncBrevoUtenteStatoReale({ email, registrato: true });

      const isCliente = db.prepare(`
        SELECT 1 FROM ordini
        WHERE utente_id = (SELECT id FROM utenti WHERE email = ?)
        LIMIT 1
      `).get(email);

      if (isCliente) {
        await syncBrevoUtenteStatoReale({ email, cliente: true });
      }
    }

    return { success: true, message: "Sync utenti storici completata" };

  } catch (err) {
    console.error("❌ Errore sync utenti storici:", err);
    return { success: false, error: "Errore sync utenti storici" };
  }
}

/* =========================================================
   LISTA UTENTI
========================================================= */
async function listaUtenti(req) {
  console.log("[DEBUG admin-utenti] listaUtenti()");

  try {
    let brevoLists = { newsletter: [], registrati: [], clienti: [] };

    try {
      brevoLists = await syncBrevo();
    } catch (err) {
      console.error("Errore syncBrevo in listaUtenti:", err);
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

        registrato: getLastEvent(u.email, "registrato") || "Sì",
        login: getLastEvent(u.email, "login"),
        logout: getLastEvent(u.email, "logout"),
        eliminato: getLastEvent(u.email, "eliminato"),
        bloccato: getLastEvent(u.email, "bloccato"),
        sbloccato: getLastEvent(u.email, "sbloccato"),

        iscritto: getNewsletterEvent(u.email, "subscribe"),
        disiscritto: getNewsletterEvent(u.email, "unsubscribe"),

        registrato_brevo: brevoLists.registrati.includes(emailLower) ? "presente" : "—",
        cliente_brevo: brevoLists.clienti.includes(emailLower) ? "presente" : "—",
        cliente_db: isClienteDB(u.email)
      };
    });

    return { success: true, utenti: output };

  } catch (err) {
    console.error("Errore lista utenti:", err);
    return { success: false, error: "Errore server." };
  }
}

/* =========================================================
   BLOCCA UTENTE
========================================================= */
async function bloccaUtente(req) {
  console.log("[DEBUG admin-utenti] bloccaUtente()");

  const { email } = req.body;
  if (!email || email === "amministratore")
    return { success: false };

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'bloccato', datetime('now'))
  `).run(email);

  return { success: true };
}

/* =========================================================
   SBLOCCA UTENTE
========================================================= */
async function sbloccaUtente(req) {
  console.log("[DEBUG admin-utenti] sbloccaUtente()");

  const { email } = req.body;
  if (!email || email === "amministratore")
    return { success: false };

  db.prepare(`
    INSERT INTO utenti_eventi (email, evento, data)
    VALUES (?, 'sbloccato', datetime('now'))
  `).run(email);

  return { success: true };
}

/* =========================================================
   ELIMINA UTENTE
========================================================= */
async function eliminaUtente(req) {
  console.log("[DEBUG admin-utenti] eliminaUtente()");

  const { email } = req.body;
  if (!email || email === "amministratore")
    return { success: false };

  try {
    const user = db.prepare(`
      SELECT id FROM utenti WHERE email = ?
    `).get(email);

    if (!user) {
      try { await syncBrevoUtenteStatoReale({ email, elimina: true }); } catch {}
      try { await inviaEmailNewsletterUnsubscribe({ email }); } catch {}
      return { success: true };
    }

    db.prepare(`DELETE FROM ordini WHERE utente_id = ?`).run(user.id);
    db.prepare(`DELETE FROM utenti_eventi WHERE email = ?`).run(email);
    db.prepare(`DELETE FROM newsletter_log WHERE email = ?`).run(email);
    db.prepare(`DELETE FROM utenti WHERE id = ?`).run(user.id);

    try { await syncBrevoUtenteStatoReale({ email, elimina: true }); } catch {}
    try { await inviaEmailNewsletterUnsubscribe({ email }); } catch {}

    return { success: true };

  } catch (err) {
    console.error("Errore elimina utente:", err);
    return { success: false, error: "Errore eliminazione utente" };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function syncBrevoUtenti(req) { return syncBrevoManuale(req); }
async function syncBrevoUtentiFull(req) { return syncBrevoFull(req); }
async function utentiLista(req) { return listaUtenti(req); }

/* =========================================================
   EXPORT — Java‑mode
========================================================= */
module.exports = {
  syncBrevoManuale,
  syncBrevoFull,
  listaUtenti,
  bloccaUtente,
  sbloccaUtente,
  eliminaUtente,

  // alias compatibilità
  syncBrevoUtenti,
  syncBrevoUtentiFull,
  utentiLista
};
