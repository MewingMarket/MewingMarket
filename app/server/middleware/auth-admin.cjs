/**
 * =========================================================
 * AUTH-ADMIN — Versione 2027.503 SAFE MODE
 * Admin riconosciuto tramite cookie di sessione
 * Compatibile con router fuzzy + frontend 2058 patchato
 * Mantiene logica originale, aggiunge:
 * - gestione cookie
 * - req.admin coerente
 * - nessun crash
 * - diagnostica minima
 * =========================================================
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

const CF_ADMIN = "GRSSMN92H25I138W";

/* =========================================================
   ESTRAZIONE TOKEN DA COOKIE
========================================================= */
function getAdminSessionFromCookie(req) {
  try {
    // Il router fuzzy 2027.503 garantisce req.cookies
    const c = req.cookies || {};
    return c.session_admin || "";
  } catch {
    return "";
  }
}

/* =========================================================
   MIDDLEWARE AUTH-ADMIN (SAFE MODE)
========================================================= */
module.exports = function authAdmin(req, res, next) {
  try {
    const sessione = getAdminSessionFromCookie(req);

    if (!sessione) {
      return res.status(401).json({
        success: false,
        error: "Non autorizzato (cookie mancante)"
      });
    }

    const user = db.prepare(`
      SELECT id, email, codice_fiscale
      FROM utenti
      WHERE sessione = ?
      LIMIT 1
    `).get(sessione);

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

    // SAFE MODE: req.admin sempre coerente
    req.admin = {
      id: user.id,
      email: user.email,
      codice_fiscale: user.codice_fiscale,
      ruolo: "admin",
      _diagnostica: "auth-admin-ok"
    };

    return next();

  } catch (err) {
    console.error("auth-admin ERROR:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
