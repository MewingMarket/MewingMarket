// =========================================================
// File: app/server/middleware/auth-user.cjs
// Middleware autenticazione utente via SessionToken
// =========================================================

const {
  findUserByEmail
} = require("../../modules/user-auth.cjs");

async function authUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.replace("Bearer ", "")
      : null;

    const email =
      req.headers["x-email"] ||
      req.body.email ||
      req.query.email ||
      null;

    if (!token || !email) {
      return res
        .status(401)
        .json({ success: false, error: "Non autorizzato" });
    }

    const user = await findUserByEmail(email);
    if (!user || user.sessionToken !== token) {
      return res
        .status(401)
        .json({ success: false, error: "Token non valido" });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error("❌ Errore authUser:", err);
    return res
      .status(500)
      .json({ success: false, error: "Errore server" });
  }
}

module.exports = authUser;
