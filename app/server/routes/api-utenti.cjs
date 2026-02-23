/**
 * =========================================================
 * File: app/server/routes/api-utenti.cjs
 * Sistema utenti reale (Airtable)
 * =========================================================
 */

const express = require("express");
const Airtable = require("airtable");
const crypto = require("crypto");

const router = express.Router();

const PAT = process.env.AIRTABLE_PAT;
const BASE = process.env.AIRTABLE_BASE;
const base = new Airtable({ apiKey: PAT }).base(BASE);

const TABLE = "Utenti";

/* ============================================================
   UTILS
============================================================ */
function hashPassword(pwd) {
  return crypto.createHash("sha256").update(pwd).digest("hex");
}

async function findUserByEmail(email) {
  const records = await base(TABLE)
    .select({
      filterByFormula: `{email} = '${email}'`,
      maxRecords: 1
    })
    .all();

  return records.length ? records[0] : null;
}

/* ============================================================
   REGISTRAZIONE
============================================================ */
router.post("/utente/register", async (req, res) => {
  const { email, password, nome } = req.body || {};

  if (!email || !password) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.json({ success: false, error: "Email già registrata" });
  }

  const record = await base(TABLE).create({
    email,
    password_hash: hashPassword(password),
    nome: nome || "",
    avatar_url: "",
    created_at: new Date().toISOString()
  });

  return res.json({ success: true });
});

/* ============================================================
   LOGIN
============================================================ */
router.post("/utente/login", async (req, res) => {
  const { email, password } = req.body || {};

  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({ success: false, error: "Credenziali non valide" });
  }

  const hash = hashPassword(password);
  if (hash !== user.get("password_hash")) {
    return res.json({ success: false, error: "Credenziali non valide" });
  }

  // Token semplice (non JWT)
  const token = crypto.randomBytes(32).toString("hex");

  res.cookie("session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 30
  });

  return res.json({ success: true, email });
});

/* ============================================================
   CAMBIO EMAIL
============================================================ */
router.post("/utente/cambia-email", async (req, res) => {
  const { email, newEmail, password } = req.body || {};

  const user = await findUserByEmail(email);
  if (!user) return res.json({ success: false });

  if (hashPassword(password) !== user.get("password_hash")) {
    return res.json({ success: false, error: "Password errata" });
  }

  await base(TABLE).update(user.id, { email: newEmail });

  return res.json({ success: true });
});

/* ============================================================
   CAMBIO PASSWORD
============================================================ */
router.post("/utente/cambia-password", async (req, res) => {
  const { email, oldPassword, newPassword } = req.body || {};

  const user = await findUserByEmail(email);
  if (!user) return res.json({ success: false });

  if (hashPassword(oldPassword) !== user.get("password_hash")) {
    return res.json({ success: false, error: "Password errata" });
  }

  await base(TABLE).update(user.id, {
    password_hash: hashPassword(newPassword)
  });

  return res.json({ success: true });
});

/* ============================================================
   RESET PASSWORD
============================================================ */
router.post("/utente/reset-password", async (req, res) => {
  const { email, newPassword } = req.body || {};

  const user = await findUserByEmail(email);
  if (!user) return res.json({ success: false });

  await base(TABLE).update(user.id, {
    password_hash: hashPassword(newPassword)
  });

  return res.json({ success: true });
});

/* ============================================================
   ELIMINA ACCOUNT
============================================================ */
router.post("/utente/profilo/elimina", async (req, res) => {
  const { email } = req.body || {};

  const user = await findUserByEmail(email);
  if (!user) return res.json({ success: false });

  await base(TABLE).destroy(user.id);

  return res.json({ success: true });
});

module.exports = router;
