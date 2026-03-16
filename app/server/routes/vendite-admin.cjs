/**
 * =========================================================
 * File: app/server/routes/vendite-admin.cjs
 * Lista vendite per Dashboard Admin (JSON mirror)
 * =========================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// Percorso JSON mirror
const SALES_JSON = path.join(__dirname, "../../public/data/sales.json");

/**
 * =========================================================
 * GET /api/admin/vendite
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/admin/vendite", authUser, (req, res) => {
  try {
    // Solo admin
    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // Se il JSON non esiste → nessuna vendita
    if (!fs.existsSync(SALES_JSON)) {
      return res.json({
        success: true,
        vendite: []
      });
    }

    // Legge vendite dal mirror JSON
    const raw = fs.readFileSync(SALES_JSON, "utf8");
    const vendite = JSON.parse(raw);

    return res.json({
      success: true,
      vendite
    });

  } catch (err) {
    console.error("❌ Errore /admin/vendite:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
