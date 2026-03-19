// =========================================================
// File: app/server/middleware/auth-admin.cjs
// Middleware ADMIN definitivo (SQL + token)
// =========================================================

const db = require("../db/database.cjs");

module.exports = function (req, res, next) {
  try {
    // Legge token dall'header (come il resto del sito)
    const tokenRaw = req.headers["x-token"];
    const token = String(tokenRaw || "").trim();

    if (!token || !token.startsWith("tok_")) {
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // Cerca utente nel DB
    const user = db
      .prepare("SELECT id, email, ruolo FROM utenti WHERE token = ?")
      .get(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Non loggato"
      });
    }

    // Normalizzazione ruolo
    const ruoloRaw = String(user.ruolo || "").trim().toLowerCase();

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

    // Salva info utente admin sulla request
    req.userId = user.id;
    req.userEmail = user.email;
    req.userRole = ruoloNorm;

    next();

  } catch (err) {
    console.error("❌ auth-admin:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
