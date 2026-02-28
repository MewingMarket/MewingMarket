// =========================================================
// File: app/server/middleware/auth-admin.cjs
// Middleware admin (token semplice)
// =========================================================

module.exports = function (req, res, next) {
  const token = req.headers["x-admin-token"];

  if (!token || !token.startsWith("adm_")) {
    return res.status(401).json({ success: false, error: "Non autorizzato" });
  }

  req.admin = true;
  next();
};
