// =========================================================
// File: app/server/routes/api-utenti.cjs
// Sistema utenti definitivo (password in chiaro)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("../lib/airtable-wrapper.cjs");

const router = express.Router();
Airtable.configure({ apiKey: process.env.AIRTABLE_PAT });
const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE_UTENTI = "Utenti";

// Genera token semplice
function genToken(prefix) {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}

/* =========================================================
   REGISTRAZIONE
========================================================= */
router.post("/utenti/registrazione", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const esiste = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = '${email}'` })
      .firstPage();

    if (esiste.length > 0) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    const token = genToken("tok");

    await base(TABLE_UTENTI).create({
      email,
      password_hash: password,
      token
    });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   LOGIN
========================================================= */
router.post("/utenti/login", async (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = '${email}'` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    if (user.get("password_hash") !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = genToken("tok");

    await base(TABLE_UTENTI).update(user.id, { token });

    return res.json({ success: true, token });
  } catch (err) {
    console.error("❌ Login:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   CAMBIO EMAIL
========================================================= */
router.post("/utenti/cambia-email", async (req, res) => {
  const { token, nuova_email, password } = req.body || {};

  if (!token || !nuova_email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{token} = '${token}'` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    if (user.get("password_hash") !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE_UTENTI).update(user.id, { email: nuova_email });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   CAMBIO PASSWORD
========================================================= */
router.post("/utenti/cambia-password", async (req, res) => {
  const { token, nuova_password } = req.body || {};

  if (!token || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{token} = '${token}'` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    await base(TABLE_UTENTI).update(user.id, {
      password_hash: nuova_password
    });

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET UTENTE
========================================================= */
router.post("/utenti/reset", async (req, res) => {
  const { email } = req.body || {};

  if (!email) {
    return res.json({ success: false, error: "Email mancante" });
  }

  try {
    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = '${email}'` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const nuovaPassword = "MM-" + Math.floor(Math.random() * 999999);
    const nuovoToken = genToken("tok");

    await base(TABLE_UTENTI).update(user.id, {
      password_hash: nuovaPassword,
      token: nuovoToken
    });

    return res.json({
      success: true,
      nuovaPassword
    });
  } catch (err) {
    console.error("❌ Reset utente:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
