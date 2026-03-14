/**
 * =========================================================
 * File: app/server/routes/vendite-admin.cjs
 * Lista vendite per Dashboard Admin (SQL)
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

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

    const stmt = db.prepare(`
      SELECT 
        v.id,
        v.uid,
        v.prodotto_id,
        v.prezzo_cent,
        v.origine,
        v.utm_source,
        v.utm_campaign,
        v.utm_medium,
        v.referrer,
        v.created_at,
        p.titolo_breve AS prodotto_titolo
      FROM vendite v
      LEFT JOIN prodotti p ON p.id = v.prodotto_id
      ORDER BY v.id DESC
    `);

    const vendite = stmt.all().map(v => ({
      ...v,
      prezzo_euro: (v.prezzo_cent / 100).toFixed(2)
    }));

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
