/**
 * =========================================================
 * DEBUG STATE — Versione 2027
 * Mostra:
 * - cookie ricevuti
 * - user/admin
 * - conteggio tabelle DB
 * - route originale
 * - versione alias usata
 * =========================================================
 */

const express = require("express");
const router = express.Router();

router.get("/api/debug/state", async (req, res) => {
  try {
    const db = req.app.get("db");

    const counts = {
      utenti: await db.count("utenti"),
      ordini: await db.count("ordini"),
      feedback: await db.count("feedback"),
      prodotti: await db.count("prodotti")
    };

    res.json({
      ok: true,
      cookies: req.cookies,
      user: req.user || null,
      admin: req.admin || null,
      db: counts,
      route: req.originalUrl,
      matchedVersion: req.matchedVersion || null
    });

  } catch (err) {
    res.json({ ok: false, error: err.message });
  }
});

module.exports = router;
