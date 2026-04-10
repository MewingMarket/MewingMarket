/**
 * =========================================================
 * API ADMIN — PROFILO ADMIN COMPLETO
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const router = express.Router();

const db = R("db/database.cjs");
const authAdmin = R("middleware/auth-admin.cjs");
const crypto = require("crypto");

// =========================================================
// UTILS
// =========================================================
function hash(p) {
  return crypto.createHash("sha256").update(String(p)).digest("hex");
}

function normalize(p) {
  return String(p || "").trim();
}

// Codice fiscale dell’unico admin
const CF_ADMIN = "GRSSMN92H25I138W";

/**
 * Recupera l’admin dal DB
 */
function getAdmin() {
  return db.prepare(`
    SELECT id, email, password_hash, codice_fiscale
    FROM utenti
    WHERE codice_fiscale = ?
    LIMIT 1
  `).get(CF_ADMIN);
}

/**
 * Aggiorna email admin
 */
function updateAdminEmail(id, nuova) {
  db.prepare(`UPDATE utenti SET email = ? WHERE id = ?`).run(nuova, id);
}

/**
 * Aggiorna password admin
 */
function updateAdminPassword(id, newHash) {
  db.prepare(`UPDATE utenti SET password_hash = ? WHERE id = ?`).run(newHash, id);
}

// =========================================================
// 1) CAMBIO EMAIL ADMIN
// =========================================================
router.post("/cambia-email", authAdmin, (req, res) => {
  let { nuova, pass } = req.body || {};

  nuova = normalize(nuova).toLowerCase();
  pass = normalize(pass);

  if (!nuova || !pass) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  const admin = getAdmin();
  if (!admin) {
    return res.json({ success: false, error: "Admin non trovato" });
  }

  // Verifica password
  if (hash(pass) !== admin.password_hash) {
    return res.json({ success: false, error: "Password errata" });
  }

  // Verifica email già in uso
  const esiste = db.prepare("SELECT id FROM utenti WHERE email = ?").get(nuova);
  if (esiste) {
    return res.json({ success: false, error: "Email già in uso" });
  }

  updateAdminEmail(admin.id, nuova);

  return res.json({
    success: true,
    message: "Email aggiornata correttamente"
  });
});

// =========================================================
// 2) CAMBIO PASSWORD ADMIN
// =========================================================
router.post("/cambia-password", authAdmin, (req, res) => {
  let { oldP, newP } = req.body || {};

  oldP = normalize(oldP);
  newP = normalize(newP);

  if (!oldP || !newP) {
    return res.json({ success: false, error: "Dati mancanti" });
  }

  const admin = getAdmin();
  if (!admin) {
    return res.json({ success: false, error: "Admin non trovato" });
  }

  // Verifica password attuale
  if (hash(oldP) !== admin.password_hash) {
    return res.json({ success: false, error: "Password errata" });
  }

  const newHash = hash(newP);
  updateAdminPassword(admin.id, newHash);

  return res.json({
    success: true,
    message: "Password aggiornata correttamente"
  });
});

// =========================================================
// 3) DATI PROFILO ADMIN
// =========================================================
router.get("/me", authAdmin, (req, res) => {
  const admin = getAdmin();

  if (!admin) {
    return res.json({ success: false, error: "Admin non trovato" });
  }

  return res.json({
    success: true,
    admin: {
      email: admin.email,
      codice_fiscale: admin.codice_fiscale,
      ruolo: "admin"
    }
  });
});

module.exports = router;
