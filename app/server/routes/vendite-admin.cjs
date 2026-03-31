/**
 * =========================================================
 * File: app/server/routes/vendite-admin.cjs
 * Dashboard Vendite Admin — SQL LIVE
 * Versione 2026.97 — KPI + vendite 30 giorni + top prodotti + UTM
 * =========================================================
 */

const express = require("express");
const db = require("../db/database.cjs");
const authUser = require("../middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/admin/analytics
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/admin/analytics", authUser, (req, res) => {
  try {
    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // =========================================================
    // 1) KPI principali
    // =========================================================
    const kpi = db.prepare(`
      SELECT 
        COUNT(*) AS venditeTotali,
        SUM(totale_cent) AS revenueTotale
      FROM ordini
      WHERE stato = 'completato'
    `).get();

    // =========================================================
    // 2) Prodotti venduti (somma qty)
    // =========================================================
    const prodottiVenduti = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE stato = 'completato'
    `).all();

    let totaleProdotti = 0;

    prodottiVenduti.forEach(o => {
      try {
        const arr = JSON.parse(o.prodotti_json);
        arr.forEach(p => totaleProdotti += (p.qty || 1));
      } catch {}
    });

    // =========================================================
    // 3) Vendite ultimi 30 giorni
    // =========================================================
    const vendite30 = db.prepare(`
      SELECT 
        DATE(data_ordine) AS giorno,
        SUM(totale_cent) AS revenue
      FROM ordini
      WHERE stato = 'completato'
        AND DATE(data_ordine) >= DATE('now', '-30 days')
      GROUP BY DATE(data_ordine)
      ORDER BY DATE(data_ordine)
    `).all();

    // =========================================================
    // 4) Top prodotti
    // =========================================================
    const ordini = db.prepare(`
      SELECT prodotti_json
      FROM ordini
      WHERE stato = 'completato'
    `).all();

    const counter = {};

    ordini.forEach(o => {
      try {
        const arr = JSON.parse(o.prodotti_json);
        arr.forEach(p => {
          if (!counter[p.prodotto_id]) {
            counter[p.prodotto_id] = { qty: 0, revenue: 0 };
          }
          counter[p.prodotto_id].qty += (p.qty || 1);
          counter[p.prodotto_id].revenue += p.prezzo_cent * (p.qty || 1);
        });
      } catch {}
    });

    const topProdotti = Object.entries(counter)
      .map(([id, v]) => ({
        prodotto_id: Number(id),
        vendite: v.qty,
        revenue: v.revenue
      }))
      .sort((a, b) => b.vendite - a.vendite)
      .slice(0, 10);

    // =========================================================
    // 5) Performance UTM (se presenti)
    // =========================================================
    const utm = db.prepare(`
      SELECT 
        utm_source AS source,
        utm_medium AS medium,
        utm_campaign AS campaign,
        COUNT(*) AS vendite
      FROM ordini
      WHERE stato = 'completato'
      GROUP BY utm_source, utm_medium, utm_campaign
    `).all();

    return res.json({
      success: true,
      kpi: {
        venditeTotali: kpi.venditeTotali || 0,
        revenueTotale: (kpi.revenueTotale || 0) / 100,
        prodottiVenduti: totaleProdotti
      },
      vendite30,
      topProdotti,
      utm
    });

  } catch (err) {
    console.error("❌ Errore /admin/analytics:", err);
    return res.json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
