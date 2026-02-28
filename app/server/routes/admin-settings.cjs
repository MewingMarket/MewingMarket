// FILE: routes/admin-settings.cjs

const express = require("express");
const router = express.Router();
const authAdmin = require("../middleware/auth-admin.cjs"); // PATCH QUI
const fs = require("fs");

const SETTINGS_FILE = "./config/settings.json";

router.get("/settings/get", authAdmin, (req, res) => {
  try {
    const settings = JSON.parse(fs.readFileSync(SETTINGS_FILE, "utf8"));
    res.json({ success: true, settings });
  } catch (err) {
    res.json({ success: false, error: "Errore lettura impostazioni" });
  }
});

router.post("/settings/save", authAdmin, (req, res) => {
  try {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 2));
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: "Errore salvataggio impostazioni" });
  }
});

module.exports = router;
