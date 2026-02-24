// =========================================================
// File: app/server/routes/api-utente.cjs
// Gestione utente: registrazione, login, credenziali
// Versione definitiva (Airtable nuova SDK, blindata)
// =========================================================

const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Airtable = require("airtable").default;

const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCredenziali } = require("../modules/email-credenziali.cjs");

const router = express.Router();

// ---------------------------------------------------------
// CONFIG AIRTABLE (nuova SDK, blindata)
// ---------------------------------------------------------
Airtable.configure({
  apiKey: process.env.AIRTABLE_PAT
});

const base = Airtable.base(process.env.AIRTABLE_BASE);
const TABLE = "Utenti";

// Helper sicuro
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
router.post("/utente/registrazione", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    // Controlla se esiste già
    const existing = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (existing.length > 0) {
      return res.json({ success: false, error: "Email già registrata" });
    }

    const hash = await bcrypt.hash(password, 10);

    await base(TABLE).create({
      Email: email,
      PasswordHash: hash,
      DataRegistrazione: new Date().toISOString(),
      UltimoAccesso: ""
    });

    // EMAIL DI BENVENUTO
    try {
      await inviaEmailRegistrazione({ email });
    } catch (err) {
      console.error("❌ Errore invio email registrazione:", err);
    }

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

    const records = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(password, safeGet(user, "PasswordHash"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET);

    // Aggiorna ultimo accesso
    try {
      await base(TABLE).update(user.id, {
        UltimoAccesso: new Date().toISOString()
      });
    } catch {}

    return res.json({ success: true, token });

  } catch (err) {
    console.error("❌ Errore login:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// CAMBIA EMAIL
// =========================================================
router.post("/utente/cambia-email", async (req, res) => {
  try {
    const { token, newEmail, password } = req.body || {};

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const oldEmail = decoded.email;

    const records = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${oldEmail}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(password, safeGet(user, "PasswordHash"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE).update(user.id, {
      Email: newEmail
    });

    // EMAIL DI CONFERMA CAMBIO EMAIL
    try {
      await inviaEmailCredenziali({ email: newEmail, tipo: "email" });
    } catch (err) {
      console.error("❌ Errore invio email cambio email:", err);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cambio email:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

// =========================================================
// CAMBIA PASSWORD
// =========================================================
router.post("/utente/cambia-password", async (req, res) => {
  try {
    const { token, oldPassword, newPassword } = req.body || {};

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const records = await base(TABLE)
      .select({
        filterByFormula: `{Email} = "${email}"`,
        maxRecords: 1
      })
      .firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(oldPassword, safeGet(user, "PasswordHash"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await base(TABLE).update(user.id, {
      PasswordHash: hash
    });

    // EMAIL DI CONFERMA CAMBIO PASSWORD
    try {
      await inviaEmailCredenziali({ email, tipo: "password" });
    } catch (err) {
      console.error("❌ Errore invio email cambio password:", err);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
