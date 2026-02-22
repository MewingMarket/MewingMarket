const jwt = require("jsonwebtoken");

module.exports = function authAdmin(req, res, next) {
  const auth = req.headers.authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, error: "Non autorizzato" });
  }

  try {
    const payload = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
    if (payload.role !== "admin") {
      return res.status(403).json({ success: false, error: "Permessi insufficienti" });
    }
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, error: "Sessione scaduta o non valida" });
  }
};
