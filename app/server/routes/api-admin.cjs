/**
 * =========================================================
 * API ADMIN — GESTIONE CREDENZIALI
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");
const crypto = require("crypto");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const router = express.Router();
const db = R("db/database.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

// UTILS
function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}
function normalize(p) {
  return String(p || "").trim();
}

const CF_ADMIN = "GRSSMN92H25I138W";

function getAdmin() {
  return db.prepare(`SELECT id, email, password_hash, codice_fiscale FROM utenti WHERE codice_fiscale = ? LIMIT 1`).get(CF_ADMIN);
}

// 1) CAMBIO EMAIL
router.post("/cambia-email", authAdmin, (req, res) => {
  let { nuova, pass } = req.body || {};
  nuova = normalize(nuova).toLowerCase();
  pass = normalize(pass);

  if (!nuova || !pass) return res.json({ success: false, error: "Dati mancanti" });

  const admin = getAdmin();
  if (!admin || hash(pass) !== admin.password_hash) return res.json({ success: false, error: "Password errata" });

  const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova);
  if (esiste) return res.json({ success: false, error: "Email già in uso" });

  db.prepare(`UPDATE utenti SET email = ? WHERE id = ?`).run(nuova, admin.id);
  return res.json({ success: true, message: "Email aggiornata correttamente" });
});

// 2) CAMBIO PASSWORD
router.post("/cambia-password", authAdmin, (req, res) => {
  let { oldP, newP } = req.body || {};
  oldP = normalize(oldP); newP = normalize(newP);

  if (!oldP || !newP) return res.json({ success: false, error: "Dati mancanti" });

  const admin = getAdmin();
  if (!admin || hash(oldP) !== admin.password_hash) return res.json({ success: false, error: "Password errata" });

  db.prepare(`UPDATE utenti SET password_hash = ? WHERE id = ?`).run(hash(newP), admin.id);
  return res.json({ success: true, message: "Password aggiornata correttamente" });
});

// 3) DATI PROFILO
router.get("/me", authAdmin, (req, res) => {
  const admin = getAdmin();
  if (!admin) return res.json({ success: false, error: "Admin non trovato" });
  return res.json({ success: true, admin: { email: admin.email, codice_fiscale: admin.codice_fiscale, ruolo: "admin" } });
});

module.exports = router;
