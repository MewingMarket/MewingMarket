/**
 * =========================================================
 * AUTH-ADMIN — Versione 2026.203 (PATCH CHIRURGICA)
 * Admin riconosciuto SOLO tramite codice fiscale (CF)
 * Mantiene logica originale, aggiunge:
 * - anti-HTML
 * - anti-502
 * - logging diagnostico
 * =========================================================
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

const CF_ADMIN = "GRSSMN92H25I138W";

function getToken(req) {
  const h = req.headers["authorization"];
  if (!h || !h.startsWith("Bearer ")) return "";
  return h.replace("Bearer ", "").trim();
}

module.exports = function authAdmin(req, res, next) {
  try {
    const token = getToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Token mancante"
      });
    }

    const user = db
      .prepare("SELECT id, email, codice_fiscale FROM utenti WHERE sessione = ? LIMIT 1")
      .get(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Sessione non valida"
      });
    }

    if (user.codice_fiscale !== CF_ADMIN) {
      return res.status(403).json({
        success: false,
        error: "Non autorizzato (admin richiesto)"
      });
    }

    // PATCH: diagnostica minima
    req.admin = {
      id: user.id,
      email: user.email,
      codice_fiscale: user.codice_fiscale,
      _diagnostica: "auth-admin-ok"
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
