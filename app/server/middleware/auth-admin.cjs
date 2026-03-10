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

    // Normalizzazione ruolo
    const ruoloRaw = req.session.user.ruolo || "";
    const ruolo = String(ruoloRaw).trim().toLowerCase();

    // Varianti accettate come admin
    const isAdmin =
      ruolo === "admin" ||
      ruolo === "amministratore" ||
      ruolo === "administrator";

    // Controllo ruolo
    if (!isAdmin) {
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
