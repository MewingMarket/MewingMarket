/**
 * =========================================================
 * File: app/server/routes/ordini-admin.cjs
 * Lista ordini per Dashboard Admin (JSON mirror)
 * =========================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

// Percorso JSON mirror
const ORDERS_JSON = path.join(__dirname, "../../public/data/orders.json");

/**
 * =========================================================
 * GET /api/admin/ordini
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/admin/ordini", authUser, (req, res) => {
  try {
    // Solo admin
    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // Legge il JSON mirror
    if (!fs.existsSync(ORDERS_JSON)) {
      return res.json({
        success: true,
        ordini: []
      });
    }

    const raw = fs.readFileSync(ORDERS_JSON, "utf8");
    const ordini = JSON.parse(raw);

    return res.json({
      success: true,
      ordini
    });

  } catch (err) {
    console.error("❌ Errore /admin/ordini:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
