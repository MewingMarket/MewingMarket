// =========================================================
// File: app/server/api-reset.cjs
// API reset password dashboard
// =========================================================

const { findUserByEmail, updateUserPassword } = require("../modules/users.cjs");

module.exports = function(app) {
  app.post("/api/reset-password", async (req, res) => {
    const { email, newPassword } = req.body || {};

    const record = await findUserByEmail(email);
    if (!record) return res.json({ success:false, error:"user_not_found" });

    await updateUserPassword(record.id, newPassword);
    res.json({ success:true });
  });
};
