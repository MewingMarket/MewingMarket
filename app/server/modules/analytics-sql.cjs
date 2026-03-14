/**
 * =========================================================
 * File: app/server/modules/analytics-sql.cjs
 * Analytics store interno (SQL) — basato su tabella "vendite"
 * =========================================================
 */

const db = require("../db/database.cjs");

/* =========================================================
   KPI PRINCIPALI
========================================================= */
function getKPI() {
  const venditeTotali = db.prepare(`
    SELECT COUNT(*) AS tot FROM vendite
  `).get().tot;

  const revenueTotale = db.prepare(`
    SELECT COALESCE(SUM(prezzo_cent), 0) AS tot
    FROM vendite
  `).get().tot;

  const prodottiVenduti = db.prepare(`
    SELECT COUNT(DISTINCT prodotto_id) AS tot
    FROM vendite
  `).get().tot;

  return {
    venditeTotali,
    revenueTotale,
    prodottiVenduti
  };
}

/* =========================================================
   TOP PRODOTTI PER VENDITE
========================================================= */
function getTopProdotti(limit = 10) {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.titolo_breve,
      COUNT(v.id) AS vendite,
      COALESCE(SUM(v.prezzo_cent), 0) AS revenue
    FROM prodotti p
    LEFT JOIN vendite v ON v.prodotto_id = p.id
    GROUP BY p.id
    ORDER BY vendite DESC
    LIMIT ?
  `);

  return stmt.all(limit);
}

/* =========================================================
   PERFORMANCE UTM
========================================================= */
function getUTMPerformance() {
  const stmt = db.prepare(`
    SELECT 
      utm_source,
      utm_medium,
      utm_campaign,
      COUNT(*) AS vendite
    FROM vendite
    WHERE utm_source IS NOT NULL
    GROUP BY utm_source, utm_medium, utm_campaign
    ORDER BY vendite DESC
  `);

  return stmt.all();
}

/* =========================================================
   VENDITE GIORNALIERE (ultimi 30 giorni)
========================================================= */
function getVenditeGiornaliere() {
  const stmt = db.prepare(`
    SELECT 
      DATE(created_at) AS data,
      COUNT(*) AS totale
    FROM vendite
    WHERE DATE(created_at) >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `);

  return stmt.all();
}

module.exports = {
  getKPI,
  getTopProdotti,
  getUTMPerformance,
  getVenditeGiornaliere
};
