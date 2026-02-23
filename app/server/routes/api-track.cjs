/**
 * =========================================================
 * File: app/server/routes/api-track.cjs
 * Tracking eventi → file JSON
 * =========================================================
 */

const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

const DATA_PATH = path.join(__dirname, "..", "..", "data", "analytics.json");

function load() {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"));
  } catch {
    return [];
  }
}

function save(data) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

router.post("/track", (req, res) => {
  const events = load();

  events.push({
    ...req.body,
    timestamp: Date.now()
  });

  save(events);

  return res.json({ success: true });
});

module.exports = router;
