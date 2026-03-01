// =========================================================
// File: app/server/routes/api-utenti.cjs
// Sistema utenti definitivo + EMAIL integrate + RESET
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("../lib/airtable-wrapper.cjs");

// EMAIL MODULES
const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCambioEmail } = require("../modules/email-cambio-email.cjs");
const { inviaEmailCambioPassword } = require("../modules/email-cambio-password.cjs");
const { inviaEmailEliminazione } = require("../modules/email-eliminazione.cjs");

// NUOVI MODULI RESET
const { inviaEmailResetPassword } = require("../modules/email-reset-password.cjs");
const { inviaEmailResetEmail } = require("../modules/email-reset-email.cjs");

const router = express.Router();
Airtable.configure({ apiKey: process.env.AIRTABLE_PAT });
const base = Airtable.base(process.env.AIRTABLE_BASE);

const TABLE_UTENTI = "Utenti";

// Escape sicuro per Airtable
function escapeAirtable(value) {
  if (!value) return "";
  return String(value).replace(/"/g, '\\"');
}

// Normalizzazione password
function normalizePassword(p) {
  return String(p || "").trim();
}

// Genera token
function genToken(prefix) {
  return prefix + "_" + crypto.randomBytes(16).toString("hex");
}

// =========================================================
// Helper: estrai token da body OPPURE da header
// =========================================================
function getToken(req) {
  return (
    normalizePassword(req.body?.token) ||
    normalizePassword(req.headers["x-token"])
  );
}

/* =========================================================
   REGISTRAZIONE
========================================================= */
router.post("/utenti/registrazione", async (req, res) => {
  let { email, password } = req.body || {};

  email = (email || "").trim().toLowerCase();
  password = normalizePassword(password);

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
          password_hash: String(password),
          token
        }
      }
    ]);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailRegistrazione({ email });

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
  password = normalizePassword(password);

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

    const savedPass = normalizePassword(user.get("password_hash"));

    if (savedPass !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = genToken("tok");

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
  let token = getToken(req);
  let { nuova_email, password } = req.body || {};

  nuova_email = (nuova_email || "").trim().toLowerCase();
  password = normalizePassword(password);

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
    const savedPass = normalizePassword(user.get("password_hash"));

    if (savedPass !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { email: nuova_email }
      }
    ]);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailCambioEmail({ email: nuova_email });

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
  let token = getToken(req);
  let { nuova_password } = req.body || {};

  nuova_password = normalizePassword(nuova_password);

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
        fields: { password_hash: String(nuova_password) }
      }
    ]);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailCambioPassword({ email: user.get("email") });

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
  let token = getToken(req);
  let { password } = req.body || {};

  password = normalizePassword(password);

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
    const savedPass = normalizePassword(user.get("password_hash"));

    if (savedPass !== password) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE_UTENTI).destroy(user.id);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailEliminazione({ email: user.get("email") });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Eliminazione account:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD — RICHIESTA LINK
========================================================= */
router.post("/utenti/reset-password-request", async (req, res) => {
  let { email } = req.body || {};
  email = (email || "").trim().toLowerCase();

  if (!email) {
    return res.json({ success: false, error: "Email mancante" });
  }

  try {
    const safeEmail = escapeAirtable(email);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{email} = "${safeEmail}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Email non trovata" });
    }

    const user = records[0];
    const resetToken = genToken("resetpass");

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { reset_password_token: resetToken }
      }
    ]);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailResetPassword({
      email,
      link: `https://mewingmarket.it/reset-password-confirm.html?token=${resetToken}`
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Reset password request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET PASSWORD — CONFERMA
========================================================= */
router.post("/utenti/reset-password-confirm", async (req, res) => {
  let { token, nuova_password } = req.body || {};

  token = (token || "").trim();
  nuova_password = normalizePassword(nuova_password);

  if (!token || !nuova_password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeToken = escapeAirtable(token);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{reset_password_token} = "${safeToken}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: {
          password_hash: String(nuova_password),
          reset_password_token: ""
        }
      }
    ]);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Reset password confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL — RICHIESTA LINK
========================================================= */
router.post("/utenti/reset-email-request", async (req, res) => {
  let { password } = req.body || {};
  password = normalizePassword(password);

  if (!password) {
    return res.json({ success: false, error: "Password mancante" });
  }

  try {
    const records = await base(TABLE_UTENTI).select().firstPage();

    const user = records.find(
      r => normalizePassword(r.get("password_hash")) === password
    );

    if (!user) {
      return res.json({ success: false, error: "Password errata" });
    }

    const resetToken = genToken("resetemail");

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: { reset_email_token: resetToken }
      }
    ]);

    // 🔵 AWAIT AGGIUNTO
    await inviaEmailResetEmail({
      email: user.get("email"),
      link: `https://mewingmarket.it/reset-email-confirm.html?token=${resetToken}`
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Reset email request:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/* =========================================================
   RESET EMAIL — CONFERMA
========================================================= */
router.post("/utenti/reset-email-confirm", async (req, res) => {
  let { token, nuova_email } = req.body || {};

  token = (token || "").trim();
  nuova_email = (nuova_email || "").trim().toLowerCase();

  if (!token || !nuova_email) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  try {
    const safeToken = escapeAirtable(token);

    const records = await base(TABLE_UTENTI)
      .select({ filterByFormula: `{reset_email_token} = "${safeToken}"` })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Token non valido" });
    }

    const user = records[0];

    await base(TABLE_UTENTI).update([
      {
        id: user.id,
        fields: {
          email: nuova_email,
          reset_email_token: ""
        }
      }
    ]);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Reset email confirm:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
