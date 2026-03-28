/* =========================================================
   File: app/server/routes/api-utenti.cjs
   Versione: 2026.70 — CF obbligatorio + Admin via CF + ZERO-INPUT RESET
   PATCH: nuova sessione in entrambi i reset + token/email restituiti
========================================================= */

const express = require("express");
const crypto = require("crypto");
const db = require("../db/database.cjs");
const jsonGen = require("../modules/generatore-json.cjs");

const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = require("../modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = require("../modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = require("../modules/email-eliminazione.cjs");

const router = express.Router();

// =========================================================
// FUNZIONI UTILI
// =========================================================
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

// =========================================================
// REGISTRAZIONE — CF OBBLIGATORIO + ADMIN VIA CF
// =========================================================
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

    db.prepare(
      "INSERT INTO utenti (email, password_hash, sessione, codice_fiscale, ruolo) VALUES (?, ?, ?, ?, ?)"
    ).run(email, passwordHash, sessione, codice_fiscale, ruolo);

    inviaEmailRegistrazione({ email });

    await jsonGen.exportUsers();

    return res.json({ success: true, token: sessione, email });

  } catch (err) {
    console.error("Registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// LOGIN — SENZA CF
// =========================================================
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

    const sessione = genToken("tok");

    db.prepare("UPDATE utenti SET sessione = ? WHERE id = ?").run(sessione, user.id);

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

// =========================================================
// CAMBIO EMAIL
// =========================================================
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

    await jsonGen.exportUsers();

    return res.json({ success: true });

  } catch (err) {
    console.error("Cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// CAMBIO PASSWORD
// =========================================================
router.post("/cambia-password", async (req, res) => {
  const sessione = getSessionToken(req);
  let { nuova_password } = req.body || {};

  nuova_password = normalizePassword(nuova_password);

  if (!sessione || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(sessione);

    if (!user) {
      return res.json({ success: false, error: "Sessione non valida" });
    }

    const newHash = hash(nuova_password);

    db.prepare("UPDATE utenti SET password_hash = ? WHERE id = ?").run(newHash, user.id);

    inviaEmailCambioPassword({ email: user.email });

    return res.json({ success: true });

  } catch (err) {
    console.error("Cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// ELIMINAZIONE ACCOUNT
// =========================================================
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

    db.prepare("DELETE FROM utenti WHERE id = ?").run(user.id);

    inviaEmailEliminazione({ email: user.email });

    await jsonGen.exportUsers();

    return res.json({ success: true });

  } catch (err) {
    console.error("Eliminazione account:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// RESET PASSWORD REQUEST — ZERO-INPUT + CF CHECK
// =========================================================
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

    console.log("[RESET-PASS-REQ] Vecchia password (mask):", mask(user.password_hash));

    db.prepare("UPDATE utenti SET password_hash = '' WHERE id = ?")
      .run(user.id);

    console.log("[RESET-PASS-REQ] Password svuotata.");

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// RESET PASSWORD CONFIRM — ZERO-INPUT + CF CHECK (PATCH 2026.70)
// =========================================================
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

    console.log("[RESET-PASS-CONFIRM] CF:", codice_fiscale, "→ id:", user.id, "email:", user.email);
    console.log("[RESET-PASS-CONFIRM] Nuova password (mask):", mask(nuova_password));

    const newHash = hash(nuova_password);
    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET password_hash = ?, sessione = ? WHERE id = ?")
      .run(newHash, newSession, user.id);

    console.log("[RESET-PASS-CONFIRM] Password aggiornata.");
    console.log("[RESET-PASS-CONFIRM] Nuova sessione:", newSession.substring(0, 6) + "****");

    inviaEmailCambioPassword({ email: user.email });

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

// =========================================================
// RESET EMAIL REQUEST — ZERO-INPUT + CF CHECK
// =========================================================
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

    console.log("[RESET-EMAIL-REQ] Vecchia email:", maskEmail(user.email));

    db.prepare("UPDATE utenti SET email = '' WHERE id = ?")
      .run(user.id);

    console.log("[RESET-EMAIL-REQ] Email svuotata.");

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset email request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// RESET EMAIL CONFIRM — ZERO-INPUT + CF CHECK (OK)
// =========================================================
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

    console.log("[RESET-EMAIL-CONFIRM] Nuova email:", maskEmail(nuova_email));

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?")
      .get(nuova_email);

    if (esiste) {
      return res.json({ success: false, error: "Email gia in uso" });
    }

    const newSession = genToken("tok");

    db.prepare("UPDATE utenti SET email = ?, sessione = ? WHERE id = ?")
      .run(nuova_email, newSession, user.id);

    console.log("[RESET-EMAIL-CONFIRM] Email aggiornata.");
    console.log("[RESET-EMAIL-CONFIRM] Nuova sessione:", newSession.substring(0, 6) + "****");

    inviaEmailCambioEmail({ email: nuova_email });

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

// =========================================================
// /me — DATI UTENTE PER DASHBOARD
// =========================================================
router.get("/me", (req, res) => {
  try {
    const sessione = getSessionToken(req);
    if (!sessione) {
      return res.status(401).json({ success: false, error: "Non loggato" });
    }

    const user = db.prepare(
      "SELECT id, email, ruolo, codice_fiscale, created_at FROM utenti WHERE sessione = ? LIMIT 1"
    ).get(sessione);

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
