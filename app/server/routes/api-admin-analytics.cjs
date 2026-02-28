/**
 * =========================================================
 * File: app/server/routes/api-admin-analytics.cjs
 * Dashboard traffico (admin)
 * =========================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");
const authAdmin = require("../middleware/auth-admin.cjs"); // PATCH QUI

const router = express.Router();

const DATA_PATH = path.join(__dirname, "..", "..", "data", "analytics.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return [];
  }
}

router.get("/admin/analytics", authAdmin, (req, res) => {
  const events = load();

  const stats = {
    visite: events.filter(e => e.event === "page_view").length,
    productView: events.filter(e => e.event === "product_view").length,
    addToCart: events.filter(e => e.event === "add_to_cart").length,
    purchase: events.filter(e => e.event === "purchase").length
  };

  return res.json({ success: true, stats, events });
});

module.exports = router;
