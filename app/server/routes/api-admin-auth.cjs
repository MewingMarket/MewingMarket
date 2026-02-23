// =========================================================
// File: app/server/routes/api-admin-auth.cjs
// Login Admin minimale (email/password da .env)
// =========================================================

const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const ADMIN_SESSION_SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret";

// Middleware per verificare sessione admin
function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.admin_session;

  if (!token) {
    return res.status(401).json({ success: false, error: "Non autorizzato" });
  }

  try {
    const [value, signature] = token.split(".");
    const expected = crypto
      .createHmac("sha256", ADMIN_SESSION_SECRET)
      .update(value)
      .digest("hex");

    if (signature !== expected) {
      return res.status(401).json({ success: false, error: "Sessione non valida" });
    }

    // opzionale: puoi mettere req.admin = true;
    next();
  } catch {
    return res.status(401).json({ success: false, error: "Sessione non valida" });
  }
}

// =========================================================
// POST /api/admin/login
// Body: { email, password }
// =========================================================
router.post("/admin/login", (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.json({ success: false, error: "Credenziali mancanti" });
  }

  if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
    return res.json({ success: false, error: "Credenziali non valide" });
  }

  const value = `${email}:${Date.now()}`;
  const signature = crypto
    .createHmac("sha256", ADMIN_SESSION_SECRET)
    .update(value)
    .digest("hex");

  const token = `${value}.${signature}`;

  res.cookie("admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: false, // metti true in produzione con HTTPS
    maxAge: 1000 * 60 * 60 * 8 // 8 ore
  });

  return res.json({ success: true });
});

// =========================================================
// GET /api/admin/me
// Verifica sessione admin
// =========================================================
router.get("/admin/me", requireAdmin, (req, res) => {
  return res.json({ success: true, email: ADMIN_EMAIL });
});

module.exports = { router, requireAdmin };
