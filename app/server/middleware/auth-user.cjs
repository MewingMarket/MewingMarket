// =========================================================
// File: app/server/middleware/auth-user.cjs
// Middleware USER definitivo (token SQL, senza rompere il DB)
// =========================================================

const db = require("../db/database.cjs");

module.exports = function (req, res, next) {
  try {
    // ROTTA PUBBLICA: /api/products (catalogo frontend)
    // NON deve essere bloccata se manca il token
    const path = (req.path || "").toLowerCase();
    const method = (req.method || "GET").toUpperCase();

    const isPublicProducts =
      method === "GET" &&
      (path === "/products" || path.startsWith("/products/"));

    if (isPublicProducts) {
      return next();
    }

    // Per tutte le altre route protette → serve token
    const tokenRaw = req.headers["x-token"];

    // Normalizzazione token (senza lowercase, per non rompere il DB)
    const token = String(tokenRaw || "").trim();

    // Token mancante o non valido
    if (!token || !token.startsWith("tok_")) {
      return res.status(401).json({
        success: false,
        error: "Non autorizzato"
      });
    }

    // Verifica che il token esista nel DB (utente reale)
    const user = db
      .prepare("SELECT id, email, ruolo FROM utenti WHERE token = ?")
      .get(token);

    if (!user) {
      return res.status(401).json({
        success: false,
        error: "Token non valido"
      });
    }

    // Salva info utente sulla request
    req.userToken = token;
    req.userId = user.id;
    req.userEmail = user.email;
    req.userRoleRaw = user.ruolo || "user";

    next();

  } catch (err) {
    console.error("❌ auth-user:", err);
    return res.status(500).json({
      success: false,
      error: "Errore server"
    });
  }
};
