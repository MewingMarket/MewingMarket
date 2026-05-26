/**
 * =========================================================
 * AUTH-ADMIN — Versione 2027.503 SAFE MODE (PATCH COMPLETA)
 * Fix: sessioni invalide → risposta immediata
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
    const c = req.cookies || {};
    return c.session_admin || "";
  } catch {
    return "";
  }
}

/* =========================================================
   MIDDLEWARE AUTH-ADMIN (SAFE MODE + PATCH)
========================================================= */
module.exports = function authAdmin(req, res, next) {
  try {
    let sessione = getAdminSessionFromCookie(req);

    // Normalizzazione sicura
    if (!sessione || typeof sessione !== "string") sessione = "";
    sessione = sessione.trim();

    // PATCH: sessione vuota/invalid → blocco immediato
    if (sessione.length < 10) {
      return res.status(401).json({
        success: false,
        error: "Non autorizzato (cookie mancante o invalido)"
      });
    }

    // Query DB
    let user;
    try {
      user = db.prepare(`
        SELECT id, email, codice_fiscale
        FROM utenti
        WHERE sessione = ?
        LIMIT 1
      `).get(sessione);
    } catch (err) {
      console.error("AUTH-ADMIN SQL ERROR:", err);
      return res.status(500).json({
        success: false,
        error: "Errore server"
      });
    }

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
