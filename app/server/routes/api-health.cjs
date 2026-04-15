/**
 * =========================================================
 * File: app/server/routes/api-health.cjs
 * API Health — Versione 2026.100
 * - /api/health
 * - Stato server + restore + DB
 * =========================================================
 */

const express = require("express");
const router = express.Router();
const path = require("path");

// DB assoluto (come altrove)
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

router.get("/health", (req, res) => {
  let dbOk = false;

  try {
    const row = db.prepare("SELECT 1 AS ok").get();
    dbOk = !!row?.ok;
  } catch (err) {
    dbOk = false;
  }

  res.json({
    success: true,
    status: "ok",
    time: new Date().toISOString(),
    restore_completed: !!global.__restore_completed,
    db_ok: dbOk
  });
});

module.exports = router;
