/**
 * =========================================================
 * File: app/server/modules/analytics-sql.cjs
 * Analytics store interno (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

/* =========================================================
   VISITE TOTALI
========================================================= */
function getVisiteTotali() {
  const stmt = db.prepare(`
    SELECT COUNT(*) AS totale
    FROM tracking
    WHERE event = 'pageview'
  `);
  return stmt.get().totale;
}

/* =========================================================
   VISITE PER PRODOTTO
========================================================= */
function getVisiteProdotto(prodotto_id) {
  const stmt = db.prepare(`
    SELECT COUNT(*) AS totale
    FROM tracking
    WHERE event = 'product_view'
      AND prodotto_id = ?
  `);
  return stmt.get(prodotto_id).totale;
}

/* =========================================================
   TOP PRODOTTI PER VISITE
========================================================= */
function getTopProdotti(limit = 10) {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.titolo_breve,
      COUNT(t.id) AS visite
    FROM prodotti p
    LEFT JOIN tracking t ON t.prodotto_id = p.id
      AND t.event = 'product_view'
    GROUP BY p.id
    ORDER BY visite DESC
    LIMIT ?
  `);
  return stmt.all(limit);
}

/* =========================================================
   CONVERSIONI GLOBALI
========================================================= */
function getConversionRate() {
  const visite = getVisiteTotali();
  const ordini = db.prepare(`SELECT COUNT(*) AS tot FROM ordini`).get().tot;

  if (visite === 0) return 0;
  return (ordini / visite) * 100;
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
      COUNT(*) AS visite
    FROM tracking
    WHERE utm_source IS NOT NULL
    GROUP BY utm_source, utm_medium, utm_campaign
    ORDER BY visite DESC
  `);

  return stmt.all();
}

/* =========================================================
   VENDITE PER PRODOTTO
========================================================= */
function getVenditeProdotto() {
  const stmt = db.prepare(`
    SELECT 
      p.id,
      p.titolo_breve,
      COUNT(o.id) AS vendite
    FROM prodotti p
    LEFT JOIN ordini o ON o.prodotti_json LIKE '%' || p.id || '%'
    GROUP BY p.id
    ORDER BY vendite DESC
  `);

  return stmt.all();
}

module.exports = {
  getVisiteTotali,
  getVisiteProdotto,
  getTopProdotti,
  getConversionRate,
  getUTMPerformance,
  getVenditeProdotto
};
