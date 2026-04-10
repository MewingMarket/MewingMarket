/**
 * =========================================================
 * File: app/server/routes/admin-dashboard.cjs
 * Dashboard Admin Unificata — Vendite + Ordini
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");

// Helper require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/admin/dashboard
 * Richiede ruolo admin
 * =========================================================
 */
router.get("/dashboard", authUser, (req, res) => {
  try {
    res.setHeader("Content-Type", "application/json");

    console.log("📊 /api/admin/dashboard → admin:", req.user?.email);

    if (req.user?.ruolo !== "admin") {
      return res.json({ success: false, error: "Accesso negato" });
    }

    // =========================================================
    // ⭐ PATCH: se la tabella ordini è vuota → svuota vendite
    // =========================================================
    const countOrdini = db.prepare(`SELECT COUNT(*) AS n FROM ordini`).get().n;

    if (countOrdini === 0) {
      console.log("⚠️ Nessun ordine nel DB → pulizia vendite automatica");

      db.prepare(`DELETE FROM vendite`).run();
      db.prepare(`DELETE FROM sqlite_sequence WHERE name='vendite'`).run();
    }

    // =========================================================
    // SEZIONE VENDITE
    // =========================================================

    const venditeKPI = db.prepare(`
      SELECT 
        COUNT(*) AS venditeTotali,
        COALESCE(SUM(prezzo_cent), 0) AS revenueTotale,
        COUNT(DISTINCT prodotto_id) AS prodottiVenduti
      FROM vendite
    `).get();

    const vendite30 = db.prepare(`
      SELECT 
        DATE(created_at) AS giorno,
        SUM(prezzo_cent) AS revenue
      FROM vendite
      WHERE DATE(created_at) >= DATE('now', '-30 days')
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at)
    `).all();

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
        o.id,
        o.utente_id,
        o.prodotti_json,
        o.totale_cent,
        o.stato,
        o.metodo_pagamento,
        o.data_ordine,
        u.email AS email_cliente
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      ORDER BY o.data_ordine DESC
    `).all();

    const ordiniKPI = {
      totali: ordini.length,
      completati: ordini.filter(o => o.stato === "completato").length,
      annullati: ordini.filter(o => o.stato === "annullato").length
    };

    // =========================================================
    // PATCH — ORIGINE SINTETICA PER OGNI ORDINE
    // =========================================================

    const venditeByUID = db.prepare(`
      SELECT 
        uid,
        origine,
        utm_source,
        utm_medium,
        utm_campaign
      FROM vendite
    `).all();

    const origineMap = {};
    venditeByUID.forEach(v => {
      origineMap[v.uid] = {
        origine: v.origine,
        utm_source: v.utm_source,
        utm_medium: v.utm_medium,
        utm_campaign: v.utm_campaign
      };
    });

    function origineSintetica(v) {
      if (!v) return "Direct";

      if (v.utm_source) {
        const src = v.utm_source.toLowerCase();
        if (src.includes("insta")) return "Instagram";
        if (src.includes("yt") || src.includes("you")) return "YouTube";
        if (src.includes("goo")) return "Google";
        if (src.includes("bot")) return "Bot";
        if (src.includes("site") || src.includes("web")) return "Sito";
        return v.utm_source;
      }

      if (v.origine) return v.origine;

      return "Direct";
    }

    const ordiniParsed = ordini.map(o => {
      const prodotti = safeParse(o.prodotti_json);

      let uid = null;
      if (prodotti.length > 0) {
        uid = prodotti[0].uid || null;
      }

      const origine = origineSintetica(origineMap[uid]);

      return {
        ...o,
        prodotti,
        email: o.email_cliente || null,
        origine_sintetica: origine
      };
    });

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
