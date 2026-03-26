/**
 * =========================================================
 * AUTH-ADMIN — Versione 2026.200
 * Admin riconosciuto SOLO tramite codice fiscale (CF)
 * Nessun token speciale, nessuna sessione separata.
 * =========================================================
 */

const db = require("../db/database.cjs");

// Codice fiscale dell’unico admin (Simone)
const CF_ADMIN = "GRSSMN92H25I138W";

/**
 * Estrae il token Bearer
 */
function getToken(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

/**
 * Middleware admin
 */
module.exports = function authAdmin(req, res, next) {
  try {
    const token = getToken(req);
    if (!token) {
      return res.status(401).json({ success: false, error: "Token mancante" });
    }

    // Recupera utente tramite sessione
    const user = db
      .prepare("SELECT id, email, codice_fiscale, ruolo FROM utenti WHERE sessione = ? LIMIT 1")
      .get(token);

    if (!user) {
      return res.status(401).json({ success: false, error: "Sessione non valida" });
    }

    // ⭐ PATCH CRITICA:
    // Admin = utente con codice fiscale admin, indipendentemente dal token
    if (user.codice_fiscale !== CF_ADMIN) {
      return res.status(403).json({ success: false, error: "Non autorizzato (admin richiesto)" });
    }

    // Admin OK → continua
    req.admin = {
      id: user.id,
      email: user.email,
      codice_fiscale: user.codice_fiscale
    };

    next();

  } catch (err) {
    console.error("auth-admin ERROR:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
};
