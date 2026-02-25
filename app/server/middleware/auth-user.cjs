// =========================================================
// File: app/server/middleware/auth-user.cjs
// Middleware utente (token semplice)
// =========================================================

module.exports = function (req, res, next) {
  const token = req.headers["x-token"];

  if (!token || !token.startsWith("tok_")) {
    return res.status(401).json({ success: false, error: "Non autorizzato" });
  }

  req.userToken = token;
  next();
};
