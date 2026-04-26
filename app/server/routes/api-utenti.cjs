/**
 * =========================================================
 * File: app/server/routes/api-utenti.cjs
 * Versione PATCHATA 2026.200 — require assoluti + percorsi stabili
 * =========================================================
 */

const express = require("express");
const crypto = require("crypto");
const path = require("path");

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");

const { inviaEmailRegistrazione } = R("modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = R("modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = R("modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = R("modules/email-eliminazione.cjs");
const { inviaEmailNewsletterUnsubscribe } = R("modules/email-newsletter-unsubscribe.cjs");

const { syncBrevoUtenteStatoReale, LISTA_BACKUP } = R("modules/liste-brevo.cjs");
const { inviaEmailLista } = R("modules/invia-email-lista.cjs");

const router = express.Router();

/* =========================================================
   FUNZIONI UTILI
========================================================= */
function normalizePassword(p) {
  return String(p || "").trim();
}

function mask(str) {
  if (!str) return "";
  if (str.length <= 2) return str[0] + "*";
  return str.substring(0, 2) + "*".repeat(str.length - 2);
}

function maskEmail(email) {
  if (!email) return "";
  const [user, domain] = email.split("@");
  return user.substring(0, 3) + "*".repeat(Math.max(1, user.length - 3)) + "@" + domain;
}

function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}

function genToken(prefix) {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}

function getSessionToken(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

/* =========================================================
   HELPER EVENTI UTENTE
========================================================= */
function logUserEvent(email, evento, note = null) {
  try {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanEvento = String(evento || "").trim();

    if (!cleanEmail || !cleanEvento) return;

    db.prepare(`
      INSERT INTO utenti_eventi (email, evento, ip, user_agent, note)
      VALUES (?, ?, NULL, NULL, ?)
    `).run(cleanEmail, cleanEvento, note);

  } catch (err) {
    console.error("❌ Errore salvataggio utenti_eventi:", err);
  }
}

/* =========================================================
   REGISTRAZIONE — CF OBBLIGATORIO + ADMIN VIA CF
========================================================= */
router.post("/registrazione", async (req, res) => {
  let { email, password, codice_fiscale } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = normalizePassword(password);
  codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

  if (!email || !password || !codice_fiscale) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(email);

    if (esiste) {
      return res.json({ success: false, error: "Email gia registrata" });
    }

    const sessione = genToken("tok");
    const passwordHash = hash(password);

    let ruolo = "user";
    if (codice_fiscale === "GRSSMN92H25I138W") {
      ruolo = "admin";
    }

    db.prepare(`
      INSERT INTO utenti (email, password_hash, sessione, codice_fiscale, ruolo)
      VALUES (?, ?, ?, ?, ?)
    `).run(email, passwordHash, sessione, codice_fiscale, ruolo);

    logUserEvent(email, "registrato", null);

    inviaEmailRegistrazione({ email });

    try {
      await syncBrevoUtenteStatoReale({
        email,
        registrato: true
      });
    } catch {}

    try {
      await inviaEmailLista({
        email: "mewingmarket2@gmail.com",
        listId: LISTA_BACKUP,
        subject: "Backup attivo",
        html: "<p>Registrazione backup attiva.</p>",
        tipo: "transazionale",
        modalita: "backup"
      });
    } catch {}

    await jsonGen.exportUsers();

    return res.json({ success: true, token: sessione, email });

  } catch (err) {
    console.error("Registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
}); 

/* =========================================================
   LOGIN — PATCH 2026.71 (sessione stabile)
========================================================= */
router.post("/login", (req, res) => {
  let { email, password } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = normalizePassword(password);

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE email = ?").get(email);

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const passwordHash = hash(password);

    if (normalizePassword(user.password_hash) !== passwordHash) {
      return res.json({ success: false, error: "Password errata" });
    }

    // PATCH: NON rigenerare token se già esiste
    let sessione = user.sessione;

    if (!sessione || sessione.length < 10) {
      sessione = genToken("tok");
      db.prepare("UPDATE utenti SET sessione = ? WHERE id = ?").run(sessione, user.id);
    }

    logUserEvent(email, "login", null);

    return res.json({
      success: true,
      token: sessione,
      email,
      ruolo: user.ruolo || "user"
    });

  } catch (err) {
    console.error("Login:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   CAMBIO EMAIL
========================================================= */
router.post("/cambia-email", async (req, res) => {
  const sessione = getSessionToken(req);
  let { nuova_email, password } = req.body || {};

  nuova_email = (nuova_email || "").trim().toLowerCase();
  password = normalizePassword(password);

  if (!sessione || !nuova_email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);

    if (!user) {
      return res.json({ success: false, error: "Sessione non valida" });
    }

    const passwordHash = hash(password);

    if (normalizePassword(user.password_hash) !== passwordHash) {
      return res.json({ success: false, error: "Password errata" });
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova_email);
    if (esiste) {
      return res.json({ success: false, error: "Email gia in uso" });
    }

    db.prepare("UPDATE utenti SET email = ? WHERE id = ?").run(nuova_email, user.id);

    inviaEmailCambioEmail({ email: nuova_email });

    try {
      await syncBrevoUtenteStatoReale({
        email: nuova_email,
        emailVecchia: user.email,
        credenzialiModificate: true
      });
    } catch {}

    await jsonGen.exportUsers();

    return res.json({ success: true });

  } catch (err) {
    console.error("Cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   CAMBIO PASSWORD — PATCHATA (Verifica Vecchia Password)
========================================================= */
router.post("/cambia-password", async (req, res) => {
  const sessione = getSessionToken(req);
  let { vecchia_password, nuova_password } = req.body || {};

  vecchia_password = normalizePassword(vecchia_password);
  nuova_password = normalizePassword(nuova_password);

  if (!sessione || !vecchia_password || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);

    if (!user) {
      return res.json({ success: false, error: "Sessione non valida" });
    }

    const oldHash = hash(vecchia_password);
    if (normalizePassword(user.password_hash) !== oldHash) {
      return res.json({ success: false, error: "La password attuale non è corretta" });
    }

    const newHash = hash(nuova_password);

    db.prepare("UPDATE utenti SET password_hash = ? WHERE id = ?").run(newHash, user.id);

    inviaEmailCambioPassword({ email: user.email });

    try {
      await syncBrevoUtenteStatoReale({
        email: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return res.json({ success: true });

  } catch (err) {
    console.error("Cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
}); 

/* =========================================================
   ELIMINAZIONE ACCOUNT — VERSIONE COMPLETA PATCHATA 2026.200
========================================================= */
router.post("/elimina-account", async (req, res) => {
  const sessione = getSessionToken(req);
  let { password } = req.body || {};

  password = normalizePassword(password);

  if (!sessione || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);

    if (!user) {
      return res.json({ success: false, error: "Sessione non valida" });
    }

    const passwordHash = hash(password);

    if (normalizePassword(user.password_hash) !== passwordHash) {
      return res.json({ success: false, error: "Password errata" });
    }

    logUserEvent(user.email, "eliminato", null);

    try { db.prepare("DELETE FROM ordini WHERE utente_id = ?").run(user.id); } catch {}
    try { db.prepare("DELETE FROM utenti_eventi WHERE email = ?").run(user.email); } catch {}
    try { db.prepare("DELETE FROM feedback WHERE utente_id = ?").run(user.id); } catch {}
    try { db.prepare("DELETE FROM newsletter_log WHERE email = ?").run(user.email); } catch {}

    try {
      await syncBrevoUtenteStatoReale({ email: user.email, elimina: true });
    } catch {}

    try {
      await inviaEmailNewsletterUnsubscribe({ email: user.email });
    } catch {}

    db.prepare("DELETE FROM utenti WHERE id = ?").run(user.id);

    inviaEmailEliminazione({ email: user.email });

    await jsonGen.exportUsers();

    return res.json({ success: true });

  } catch (err) {
    console.error("Eliminazione account:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD REQUEST — ZERO-INPUT + CF CHECK
========================================================= */
router.post("/reset-password-request", (req, res) => {
  let { codice_fiscale } = req.body || {};
  codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

  if (!codice_fiscale || codice_fiscale.length !== 16) {
    return res.json({ success: false, error: "Codice fiscale non valido" });
  }

  try {
    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    db.prepare("UPDATE utenti SET password_hash = '' WHERE id = ?").run(user.id);

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD CONFIRM — ZERO-INPUT + CF CHECK
========================================================= */
router.post("/reset-password-confirm", (req, res) => {
  let { nuova_password, codice_fiscale } = req.body || {};

  nuova_password = normalizePassword(nuova_password);
  codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

  if (!nuova_password || !codice_fiscale) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const newHash = hash(nuova_password);
    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET password_hash = ?, sessione = ? WHERE id = ?")
      .run(newHash, newSession, user.id);

    inviaEmailCambioPassword({ email: user.email });

    try {
      syncBrevoUtenteStatoReale({
        email: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return res.json({
      success: true,
      token: newSession,
      email: user.email
    });

  } catch (err) {
    console.error("Reset password confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
}); 

/* =========================================================
   RESET EMAIL REQUEST — ZERO-INPUT + CF CHECK
========================================================= */
router.post("/reset-email-request", (req, res) => {
  let { codice_fiscale } = req.body || {};
  codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

  if (!codice_fiscale || codice_fiscale.length !== 16) {
    return res.json({ success: false, error: "Codice fiscale non valido" });
  }

  try {
    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    db.prepare("UPDATE utenti SET email = '' WHERE id = ?").run(user.id);

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset email request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL CONFIRM — ZERO-INPUT + CF CHECK
========================================================= */
router.post("/reset-email-confirm", async (req, res) => {
  let { nuova_email, codice_fiscale } = req.body || {};

  nuova_email = (nuova_email || "").trim().toLowerCase();
  codice_fiscale = (codice_fiscale || "").trim().toUpperCase();

  if (!nuova_email || !codice_fiscale) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare(
      "SELECT * FROM utenti WHERE codice_fiscale = ? LIMIT 1"
    ).get(codice_fiscale);

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova_email);
    if (esiste) {
      return res.json({ success: false, error: "Email gia in uso" });
    }

    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET email = ?, sessione = ? WHERE id = ?")
      .run(nuova_email, newSession, user.id);

    inviaEmailCambioEmail({ email: nuova_email });

    try {
      await syncBrevoUtenteStatoReale({
        email: nuova_email,
        emailVecchia: user.email,
        credenzialiModificate: true
      });
    } catch {}

    return res.json({
      success: true,
      token: newSession,
      email: nuova_email
    });

  } catch (err) {
    console.error("Reset email confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   /me — DATI UTENTE PER DASHBOARD E PROFILO
========================================================= */
router.get("/me", (req, res) => {
  try {
    const sessione = getSessionToken(req);
    if (!sessione) {
      return res.status(401).json({ success: false, error: "Non loggato" });
    }

    const user = db.prepare(`
      SELECT id, email, ruolo, codice_fiscale, created_at
      FROM utenti
      WHERE sessione = ?
      LIMIT 1
    `).get(sessione);

    if (!user) {
      return res.status(401).json({ success: false, error: "Sessione non valida" });
    }

    return res.json({ success: true, utente: user });

  } catch (err) {
    console.error("/me:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
