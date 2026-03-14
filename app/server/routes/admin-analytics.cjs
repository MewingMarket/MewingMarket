/**
 * =========================================================
 * File: app/server/routes/admin-analytics.cjs
 * Endpoint analytics per dashboard admin
 * =========================================================
 */

const express = require("express");
const router = express.Router();

const {
  getKPI,
  getTopProdotti,
  getUTMPerformance,
  getVenditeGiornaliere
} = require("../modules/analytics-sql.cjs");

router.get("/admin/analytics", (req, res) => {
  try {
    const kpi = getKPI();
    const topProdotti = getTopProdotti(10);
    const utm = getUTMPerformance();
    const venditeGiornaliere = getVenditeGiornaliere();

    res.json({
      success: true,
      kpi,
      topProdotti,
      utm,
      venditeGiornaliere
    });

  } catch (err) {
    console.error("❌ /admin/analytics error:", err);
    res.json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
