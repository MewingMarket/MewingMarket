// FILE: routes/admin-login.cjs

const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const router = express.Router();

router.post("/login", async (req, res) => {
  const { password } = req.body;

  try {
    const hash = process.env.ADMIN_PASSWORD_HASH;

    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.json({ success: false, error: "Password errata" });

    const token = jwt.sign(
      { role: "admin" },
      process.env.ADMIN_JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ success: true, token });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
