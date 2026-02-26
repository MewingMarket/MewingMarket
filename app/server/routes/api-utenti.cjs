// =========================================================
// File: app/server/routes/api-utenti.cjs
// Sistema utenti definitivo + EMAIL integrate
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("../lib/airtable-wrapper.cjs");

// EMAIL MODULES
const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = require("../modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = require("../modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = require("../modules/email-eliminazione.cjs");

const router = express.Router();
Airtable.configure({ apiKey: process.env.AIRTABLE_PAT });
const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE_UTENTI = "Utenti";

// Escape sicuro per Airtable
function escapeAirtable(value) {
  if (!value) return "";
  return String(value).replace(/"/g, '\\"');
}

// Genera token
function genToken(prefix) {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}

/* =========================================================
   REGISTRAZIONE
========================================================= */
router.post("/utenti/registrazione", async (req, res) => {
  let { email, password } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = (password || "").trim();

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeEmail = escapeAirtable(email);

    const esiste = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = "${safeEmail}"` })
      .firstPage();

    if (esiste.length > 0) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    const token = genToken("tok");

    await base(TABLE_UTENTI).create([
      {
        fields: {
          email,
          password_hash: password,
          token
        }
      }
    ]);

    inviaEmailRegistrazione({ email });

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
  let { email, password } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = (password || "").trim();

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeEmail = escapeAirtable(email);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = "${safeEmail}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    if (user.get("password_hash") !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = genToken("tok");

    // PATCH IMPORTANTE: update in forma ARRAY
    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { token }
      }
    ]);

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
  let { token, nuova_email, password } = req.body || {};

  token = (token || "").trim();
  nuova_email = (nuova_email || "").trim().toLowerCase();
  password = (password || "").trim();

  if (!token || !nuova_email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeToken = escapeAirtable(token);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{token} = "${safeToken}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    if (user.get("password_hash") !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { email: nuova_email }
      }
    ]);

    inviaEmailCambioEmail({ email: nuova_email });

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
  let { token, nuova_password } = req.body || {};

  token = (token || "").trim();
  nuova_password = (nuova_password || "").trim();

  if (!token || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeToken = escapeAirtable(token);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{token} = "${safeToken}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { password_hash: nuova_password }
      }
    ]);

    inviaEmailCambioPassword({ email: user.get("email") });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   ELIMINAZIONE ACCOUNT
========================================================= */
router.post("/utenti/elimina-account", async (req, res) => {
  let { token, password } = req.body || {};

  token = (token || "").trim();
  password = (password || "").trim();

  if (!token || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeToken = escapeAirtable(token);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{token} = "${safeToken}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    if (user.get("password_hash") !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE_UTENTI).destroy(user.id);

    inviaEmailEliminazione({ email: user.get("email") });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Eliminazione account:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
