// =========================================================
// File: app/server/middleware/auth-user.cjs
// =========================================================

module.exports = function (req, res, next) {
  const token = req.headers["x-token"];

  if (!token || typeof token !== "string" || !token.startsWith("tok_")) {
    return res.status(401).json({
      success: false,
      error: "Non autorizzato"
    });
  }

  req.userToken = token;
  next();
};
