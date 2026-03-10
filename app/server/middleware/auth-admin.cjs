// =========================================================
// File: app/server/middleware/auth-admin.cjs
// Middleware ADMIN definitivo (basato su Airtable + sessione)
// =========================================================

module.exports = function (req, res, next) {
  try {
    // Nessuna sessione → non loggato
    if (!req.session || !req.session.user) {
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // Controllo ruolo
    if (req.session.user.ruolo !== "admin") {
      return res.status(403).json({
        success: false,
        error: "Non autorizzato"
      });
    }

    next();

  } catch (err) {
    console.error("❌ auth-admin:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
