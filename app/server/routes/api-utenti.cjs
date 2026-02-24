// =========================================================
// File: app/server/routes/api-utenti.cjs
// Sistema utenti reale (Airtable)
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const crypto = require("crypto");
const Airtable = require("airtable").default;

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const TABLE = "Utenti";

// =========================================================
// UTILS
// =========================================================
function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

async function findUserByEmail(email) {
  const records = await base(TABLE)
    .select({
      filterByFormula: `{Email} = "${email}"`,
      maxRecords: 1
    })
    .firstPage();

  return records.length ? records[0] : null;
}

function safeGet(record, field) {
  try {
    return record.get(field) ?? null;
  } catch {
    return null;
  }
}

// =========================================================
// REGISTRAZIONE
// =========================================================
router.post("/utente/register", async (req, res) => {
  try {
    const { email, password, nome } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    await base(TABLE).create({
      Email: email,
      PasswordHash: hashPassword(password),
      Nome: nome || "",
      AvatarUrl: "",
      DataRegistrazione: new Date().toISOString()
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore registrazione:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// LOGIN
// =========================================================
router.post("/utente/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ success: false, error: "Credenziali non valide" });
    }

    const hash = hashPassword(password);
    if (hash !== safeGet(user, "PasswordHash")) {
      return res.json({ success: false, error: "Credenziali non valide" });
    }

    // Token semplice (compatibile con tuo sistema)
    const token = "tok_" + crypto.randomBytes(32).toString("hex");

    return res.json({ success: true, token, email });

  } catch (err) {
    console.error("❌ Errore login:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// CAMBIO EMAIL
// =========================================================
router.post("/utente/cambia-email", async (req, res) => {
  try {
    const { email, newEmail, password } = req.body || {};

    const user = await findUserByEmail(email);
    if (!user) return res.json({ success: false });

    if (hashPassword(password) !== safeGet(user, "PasswordHash")) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE).update(user.id, { Email: newEmail });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// CAMBIO PASSWORD
// =========================================================
router.post("/utente/cambia-password", async (req, res) => {
  try {
    const { email, oldPassword, newPassword } = req.body || {};

    const user = await findUserByEmail(email);
    if (!user) return res.json({ success: false });

    if (hashPassword(oldPassword) !== safeGet(user, "PasswordHash")) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE).update(user.id, {
      PasswordHash: hashPassword(newPassword)
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// RESET PASSWORD
// =========================================================
router.post("/utente/reset-password", async (req, res) => {
  try {
    const { email, newPassword } = req.body || {};

    const user = await findUserByEmail(email);
    if (!user) return res.json({ success: false });

    await base(TABLE).update(user.id, {
      PasswordHash: hashPassword(newPassword)
    });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore reset password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// ELIMINA ACCOUNT
// =========================================================
router.post("/utente/profilo/elimina", async (req, res) => {
  try {
    const { email } = req.body || {};

    const user = await findUserByEmail(email);
    if (!user) return res.json({ success: false });

    await base(TABLE).destroy(user.id);

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore elimina account:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
