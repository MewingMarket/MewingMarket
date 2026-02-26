// =========================================================
// File: app/server/middleware/auth-user.cjs
// Middleware utente (token semplice e coerente con Airtable)
// =========================================================

module.exports = function (req, res, next) {
  const token = req.headers["x-token"];

  // Token mancante o non valido
  if (!token || typeof token !== "string" || !token.startsWith("tok_")) {
    return res.status(401).json({
      success: false,
      error: "Non autorizzato"
    });
  }

  // Token valido → lo passo al router
  req.userToken = token;
  next();
};
