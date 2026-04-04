/**
 * =========================================================
 * AUTH-ADMIN — Versione 2026.202 (PATCH FINALE)
 * Admin riconosciuto SOLO tramite codice fiscale (CF)
 * NON rompe le balle alle pagine che non usano adminFetch
 * =========================================================
 */

const db = require("../db/database.cjs");

// Codice fiscale dell’unico admin (Simone)
const CF_ADMIN = "GRSSMN92H25I138W";

function getToken(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

module.exports = function authAdmin(req, res, next) {
  try {
    const token = getToken(req);

    // ⭐ PATCH: se la route richiede auth-admin, ma il client non manda token,
    // rispondiamo normalmente con 401 SENZA rompere nulla.
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token mancante"
      });
    }

    // Recupera utente tramite sessione
    const user = db
      .prepare("SELECT id, email, codice_fiscale FROM utenti WHERE sessione = ? LIMIT 1")
      .get(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Sessione non valida"
      });
    }

    // ⭐ Admin = CF admin, indipendentemente da ruolo o altro
    if (user.codice_fiscale !== CF_ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Non autorizzato (admin richiesto)"
      });
    }

    // Admin OK
    req.admin = {
      id: user.id,
      email: user.email,
      codice_fiscale: user.codice_fiscale
    };

    next();

  } catch (err) {
    console.error("auth-admin ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
