// =========================================================
// File: app/server/middleware/auth-user.cjs
// Middleware USER definitivo (normalizzazione token + ruolo)
// =========================================================

module.exports = function (req, res, next) {
  try {
    let tokenRaw = req.headers["x-token"];

    // Normalizzazione token
    const token = String(tokenRaw || "").trim().toLowerCase();

    // Token mancante o non valido
    if (!token || !token.startsWith("tok_")) {
      return res.status(401).json({
        success: false,
        error: "Non autorizzato"
      });
    }

    // Salva token normalizzato
    req.userToken = token;

    next();

  } catch (err) {
    console.error("❌ auth-user:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
