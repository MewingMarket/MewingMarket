/* =========================================================
   File: app/server/routes/api-utenti.cjs
   Versione: 2026.9 — SQL + JSON mirror + hashing password
   Patch: Reset email PUBLIC (password + token locale)
   Stato: VERSIONE DEFINITIVA E STABILE
========================================================= */

const express = require("express");
const crypto = require("crypto");
const db = require("../db/database.cjs");
const jsonGen = require("../modules/generatore-json.cjs");

const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = require("../modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = require("../modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = require("../modules/email-eliminazione.cjs");

const { inviaEmailResetPassword } = require("../modules/email-reset-password.cjs");
const { inviaEmailResetEmail } = require("../modules/email-reset-email.cjs");

const router = express.Router();

function normalizePassword(p) {
  return String(p || "").trim();
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
   REGISTRAZIONE (PUBLIC)
========================================================= */
router.post("/registrazione", async (req, res) => {
  let { email, password } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = normalizePassword(password);

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(email);

    if (esiste) {
      return res.json({ success: false, error: "Email gia registrata" });
    }

    const sessione = genToken("tok");
    const passwordHash = hash(password);

    db.prepare("INSERT INTO utenti (email, password_hash, sessione) VALUES (?, ?, ?)")
      .run(email, passwordHash, sessione);

    inviaEmailRegistrazione({ email });

    await jsonGen.exportUsers();

    return res.json({ success: true, token: sessione, email });

  } catch (err) {
    console.error("Registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   LOGIN (PUBLIC)
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

/* =========================================================
   CAMBIO EMAIL (PRIVATE)
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

    await jsonGen.exportUsers();

    return res.json({ success: true });

  } catch (err) {
    console.error("Cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   CAMBIO PASSWORD (PRIVATE)
========================================================= */
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

/* =========================================================
   ELIMINAZIONE ACCOUNT (PRIVATE)
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
   RESET PASSWORD REQUEST (PUBLIC)
========================================================= */
router.post("/reset-password-request", (req, res) => {
  let { email } = req.body || {};
  email = (email || "").trim().toLowerCase();

  if (!email) {
    return res.json({ success: false, error: "Email mancante" });
  }

  try {
    const user = db.prepare("SELECT id FROM utenti WHERE email = ?").get(email);

    if (!user) {
      return res.json({ success: false, error: "Email non trovata" });
    }

    const resetToken = genToken("resetpass");

    db.prepare("UPDATE utenti SET reset_password_token = ? WHERE id = ?")
      .run(resetToken, user.id);

    inviaEmailResetPassword({
      email: email,
      link: "https://mewingmarket.it/reset-password-confirm.html?token=" + resetToken
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD CONFIRM (PUBLIC)
========================================================= */
router.post("/reset-password-confirm", (req, res) => {
  let { token, nuova_password } = req.body || {};

  token = (token || "").trim();
  nuova_password = normalizePassword(nuova_password);

  if (!token || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT id FROM utenti WHERE reset_password_token = ?")
      .get(token);

    if (!user) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const newHash = hash(nuova_password);

    db.prepare("UPDATE utenti SET password_hash = ?, reset_password_token = '', sessione = '' WHERE id = ?")
      .run(newHash, user.id);

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL REQUEST (PUBLIC + PASSWORD + TOKEN)
========================================================= */
router.post("/reset-email-request", (req, res) => {
  let { password, token } = req.body || {};

  password = normalizePassword(password);
  token = (token || "").trim();

  if (!password || !token) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti WHERE sessione = ?").get(token);

    if (!user) {
      return res.json({ success: false, error: "Sessione non valida" });
    }

    const passwordHash = hash(password);

    if (normalizePassword(user.password_hash) !== passwordHash) {
      return res.json({ success: false, error: "Password errata" });
    }

    const resetToken = genToken("resetemail");

    db.prepare("UPDATE utenti SET reset_email_token = ? WHERE id = ?")
      .run(resetToken, user.id);

    inviaEmailResetEmail({
      email: user.email,
      link: "https://mewingmarket.it/reset-email-confirm.html?token=" + resetToken
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset email request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL CONFIRM (PUBLIC)
========================================================= */
router.post("/reset-email-confirm", (req, res) => {
  let { token, nuova_email } = req.body || {};

  token = (token || "").trim();
  nuova_email = (nuova_email || "").trim().toLowerCase();

  if (!token || !nuova_email) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT id FROM utenti WHERE reset_email_token = ?")
      .get(token);

    if (!user) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?")
      .get(nuova_email);

    if (esiste) {
      return res.json({ success: false, error: "Email gia in uso" });
    }

    db.prepare("UPDATE utenti SET email = ?, reset_email_token = '', sessione = '' WHERE id = ?")
      .run(nuova_email, user.id);

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset email confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
