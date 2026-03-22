/* =========================================================
   File: app/server/routes/api-utenti.cjs
   Versione: 2026.21 — ZERO-INPUT RESET SYSTEM + LOG + EMAIL
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

const router = express.Router();

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
   RESET PASSWORD REQUEST — ZERO-INPUT + LOG
========================================================= */
router.post("/reset-password-request", (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM utenti ORDER BY id LIMIT 1").get();

    if (user) {
      console.log("[RESET-PASS-REQ] Vecchia password (mask):", mask(user.password_hash));
      console.log("[RESET-PASS-REQ] Svuotamento password…");
      db.prepare("UPDATE utenti SET password_hash = '' WHERE id = ?").run(user.id);
      console.log("[RESET-PASS-REQ] Password svuotata.");
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD CONFIRM — ZERO-INPUT + LOG
========================================================= */
router.post("/reset-password-confirm", (req, res) => {
  let { nuova_password } = req.body || {};

  nuova_password = normalizePassword(nuova_password);

  if (!nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti ORDER BY id LIMIT 1").get();

    if (!user) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    console.log("[RESET-PASS-CONFIRM] Nuova password (mask):", mask(nuova_password));

    const newHash = hash(nuova_password);

    db.prepare("UPDATE utenti SET password_hash = ? WHERE id = ?")
      .run(newHash, user.id);

    console.log("[RESET-PASS-CONFIRM] Password aggiornata.");

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset password confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL REQUEST — ZERO-INPUT + LOG
========================================================= */
router.post("/reset-email-request", (req, res) => {
  try {
    const user = db.prepare("SELECT * FROM utenti ORDER BY id LIMIT 1").get();

    if (user) {
      console.log("[RESET-EMAIL-REQ] Vecchia email:", maskEmail(user.email));
      console.log("[RESET-EMAIL-REQ] Svuotamento email…");
      db.prepare("UPDATE utenti SET email = '' WHERE id = ?").run(user.id);
      console.log("[RESET-EMAIL-REQ] Email svuotata.");
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("Reset email request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL CONFIRM — ZERO-INPUT + LOG + EMAIL + SESSION FIX
========================================================= */
router.post("/reset-email-confirm", async (req, res) => {
  let { nuova_email } = req.body || {};

  nuova_email = (nuova_email || "").trim().toLowerCase();

  if (!nuova_email) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const user = db.prepare("SELECT * FROM utenti ORDER BY id LIMIT 1").get();

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

module.exports = router;
