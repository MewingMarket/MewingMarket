// =========================================================
// File: app/server/api-login.cjs
// API login dashboard (admin)
// =========================================================

const crypto = require("crypto");
const { findUserByEmail } = require("../modules/users.cjs");

const SESSIONS = new Map();

function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  SESSIONS.set(token, { userId, createdAt: Date.now() });
  return token;
}

module.exports = function(app) {
  app.post("/api/login", async (req, res) => {
    const { email, password } = req.body || {};

    const record = await findUserByEmail(email);
    if (!record) return res.json({ success:false, error:"user_not_found" });

    const f = record.fields;
    if (f.password_hash !== password)
      return res.json({ success:false, error:"wrong_password" });

    if (f.ruolo !== "admin")
      return res.json({ success:false, error:"not_admin" });

    const token = createSession(record.id);
    res.json({ success:true, token });
  });
};
