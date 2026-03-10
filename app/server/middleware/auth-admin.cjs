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
    const ruoloRaw = String(req.session.user.ruolo || "").trim().toLowerCase();

    // Mappatura ruoli → normalizzazione totale
    let ruoloNorm = "user"; // fallback sicuro

    if (
      ruoloRaw.includes("admin") ||
      ruoloRaw.includes("amministrator")
    ) {
      ruoloNorm = "admin";
    } else if (
      ruoloRaw.includes("user") ||
      ruoloRaw.includes("utente")
    ) {
      ruoloNorm = "user";
    } else if (
      ruoloRaw.includes("guest") ||
      ruoloRaw.includes("ospite")
    ) {
      ruoloNorm = "guest";
    }

    // Controllo ruolo admin
    if (ruoloNorm !== "admin") {
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
