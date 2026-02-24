// =========================================================
// File: app/server/routes/api-utente.cjs
// Gestione utente: registrazione, login, credenziali
// =========================================================

const express = require("express");
const router = express.Router();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const Airtable = require("airtable");
const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const { inviaEmailRegistrazione } = require("../modules/email-registrazione.cjs");
const { inviaEmailCredenziali } = require("../modules/email-credenziali.cjs");

const TABLE = "Utenti";

// =========================================================
// REGISTRAZIONE
// =========================================================
router.post("/utente/registrazione", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, error: "Dati mancanti" });
    }

    const hash = await bcrypt.hash(password, 10);

    const record = await base(TABLE).create({
      email,
      password: hash,
      data: new Date().toISOString()
    });

    // EMAIL DI BENVENUTO
    await inviaEmailRegistrazione({ email });

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
    const { email, password } = req.body;

    const records = await base(TABLE).select({
      filterByFormula: `{email} = '${email}'`
    }).firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(password, user.get("password"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    const token = jwt.sign({ email }, process.env.JWT_SECRET);

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
    const { token, newEmail, password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const oldEmail = decoded.email;

    const records = await base(TABLE).select({
      filterByFormula: `{email} = '${oldEmail}'`
    }).firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(password, user.get("password"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    await base(TABLE).update(user.id, {
      email: newEmail
    });

    // EMAIL DI CONFERMA CAMBIO EMAIL
    await inviaEmailCredenziali({ email: newEmail, tipo: "email" });

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
    const { token, oldPassword, newPassword } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const email = decoded.email;

    const records = await base(TABLE).select({
      filterByFormula: `{email} = '${email}'`
    }).firstPage();

    if (records.length === 0) {
      return res.json({ success: false, error: "Utente non trovato" });
    }

    const user = records[0];

    const ok = await bcrypt.compare(oldPassword, user.get("password"));
    if (!ok) {
      return res.json({ success: false, error: "Password errata" });
    }

    const hash = await bcrypt.hash(newPassword, 10);

    await base(TABLE).update(user.id, {
      password: hash
    });

    // EMAIL DI CONFERMA CAMBIO PASSWORD
    await inviaEmailCredenziali({ email, tipo: "password" });

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore cambio password:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
