/**
 * =========================================================
 * File: app/server/routes/admin-dashboard.cjs
 * Dashboard Admin Unificata — Vendite + Ordini
 * Versione 2026.98 — SQL LIVE + KPI + UTM + Top Prodotti
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/admin/dashboard
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/admin/dashboard", authUser, (req, res) => {
  try {
    // ⭐ PATCH 1 — Forza risposta JSON
    res.setHeader("Content-Type", "application/json");

    // ⭐ PATCH 2 — Log diagnostico
    console.log("📊 /api/admin/dashboard → admin:", req.user?.email);

    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // =========================================================
    // SEZIONE VENDITE
    // =========================================================

    // KPI vendite
    const venditeKPI = db.prepare(`
      SELECT 
        COUNT(*) AS venditeTotali,
        COALESCE(SUM(prezzo_cent), 0) AS revenueTotale,
        COUNT(DISTINCT prodotto_id) AS prodottiVenduti
      FROM vendite
    `).get();

    // Vendite ultimi 30 giorni
    const vendite30 = db.prepare(`
      SELECT 
        DATE(created_at) AS giorno,
        SUM(prezzo_cent) AS revenue
      FROM vendite
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).all();

    // Top prodotti
    const topProdotti = db.prepare(`
      SELECT 
        prodotto_id,
        COUNT(*) AS vendite,
        SUM(prezzo_cent) AS revenue
      FROM vendite
      GROUP BY prodotto_id
      ORDER BY vendite DESC
      LIMIT 10
    `).all();

    // UTM performance
    const utm = db.prepare(`
      SELECT 
        utm_source AS source,
        utm_medium AS medium,
        utm_campaign AS campaign,
        COUNT(*) AS vendite
      FROM vendite
      WHERE utm_source IS NOT NULL
      GROUP BY utm_source, utm_medium, utm_campaign
      ORDER BY vendite DESC
    `).all();

    // =========================================================
    // SEZIONE ORDINI
    // =========================================================

    const ordini = db.prepare(`
      SELECT 
        id,
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        data_ordine
      FROM ordini
      ORDER BY data_ordine DESC
    `).all();

    const ordiniKPI = {
      totali: ordini.length,
      completati: ordini.filter(o => o.stato === "completato").length,
      annullati: ordini.filter(o => o.stato === "annullato").length
    };

    const ordiniParsed = ordini.map(o => ({
      ...o,
      prodotti: safeParse(o.prodotti_json)
    }));

    // =========================================================
    // RISPOSTA UNIFICATA
    // =========================================================
    return res.json({
      success: true,

      vendite: {
        kpi: {
          venditeTotali: venditeKPI.venditeTotali,
          revenueTotale: venditeKPI.revenueTotale / 100,
          prodottiVenduti: venditeKPI.prodottiVenduti
        },
        vendite30,
        topProdotti,
        utm
      },

      ordini: {
        kpi: ordiniKPI,
        lista: ordiniParsed
      }
    });

  } catch (err) {
    console.error("❌ Errore /admin/dashboard:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

module.exports = router;
