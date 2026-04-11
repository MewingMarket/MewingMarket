/**
 * =========================================================
 * File: app/server/modules/analytics.cjs
 * Modulo Analytics Unificato — Vendite + Ordini
 * Versione 2026.99 — SQL LIVE + UTM estesi
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

/* =========================================================
   HELPER SICURO
========================================================= */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   VENDITE — KPI
========================================================= */
function getVenditeKPI() {
  return db.prepare(`
    SELECT 
      COUNT(*) AS venditeTotali,
      COALESCE(SUM(prezzo_cent), 0) AS revenueTotale,
      COUNT(DISTINCT prodotto_id) AS prodottiVenduti
    FROM vendite
  `).get();
}

/* =========================================================
   VENDITE — Ultimi 30 giorni
========================================================= */
function getVendite30() {
  return db.prepare(`
    SELECT 
      DATE(created_at) AS giorno,
      SUM(prezzo_cent) AS revenue
    FROM vendite
    WHERE DATE(created_at) >= DATE('now', '-30 days')
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at)
  `).all();
}

/* =========================================================
   VENDITE — Top prodotti
========================================================= */
function getTopProdotti(limit = 10) {
  return db.prepare(`
    SELECT 
      prodotto_id,
      COUNT(*) AS vendite,
      SUM(prezzo_cent) AS revenue
    FROM vendite
    GROUP BY prodotto_id
    ORDER BY vendite DESC
    LIMIT ?
  `).all(limit);
}

/* =========================================================
   VENDITE — UTM performance (con referrer)
========================================================= */
function getUTM() {
  return db.prepare(`
    SELECT 
      utm_source AS source,
      utm_medium AS medium,
      utm_campaign AS campaign,
      referrer,
      COUNT(*) AS vendite
    FROM vendite
    WHERE utm_source IS NOT NULL OR referrer IS NOT NULL
    GROUP BY utm_source, utm_medium, utm_campaign, referrer
    ORDER BY vendite DESC
  `).all();
}

/* =========================================================
   VENDITE — Origini sintetiche aggregate
========================================================= */
function getOriginiSintetiche() {
  return db.prepare(`
    SELECT 
      CASE
        WHEN utm_source LIKE '%insta%' OR referrer LIKE '%instagram%' THEN 'Instagram'
        WHEN utm_source LIKE '%tiktok%' OR referrer LIKE '%tiktok%' THEN 'TikTok'
        WHEN utm_source LIKE '%you%' OR referrer LIKE '%youtube%' THEN 'YouTube'
        WHEN utm_source LIKE '%fb%' OR utm_source LIKE '%face%' OR referrer LIKE '%facebook%' THEN 'Facebook'
        WHEN referrer LIKE '%whatsapp%' THEN 'WhatsApp'
        WHEN referrer LIKE '%telegram%' THEN 'Telegram'
        WHEN utm_source LIKE '%email%' OR utm_medium LIKE '%email%' THEN 'Email'
        WHEN utm_source LIKE '%bot%' OR utm_medium LIKE '%bot%' THEN 'Bot'
        WHEN utm_medium LIKE '%ads%' OR utm_medium LIKE '%cpc%' THEN 'Paid Ads'
        WHEN referrer LIKE '%google%' AND utm_medium = 'organic' THEN 'Organic Search'
        WHEN referrer IS NOT NULL AND referrer NOT LIKE '%mewingmarket%' THEN 'Referral'
        WHEN utm_source LIKE '%site%' OR utm_medium LIKE '%product_page%' THEN 'Sito'
        ELSE 'Direct'
      END AS origine_sintetica,
      COUNT(*) AS vendite
    FROM vendite
    GROUP BY origine_sintetica
    ORDER BY vendite DESC
  `).all();
}

/* =========================================================
   ORDINI — KPI
========================================================= */
function getOrdiniKPI() {
  const ordini = db.prepare(`
    SELECT stato
    FROM ordini
  `).all();

  return {
    totali: ordini.length,
    completati: ordini.filter(o => o.stato === "completato").length,
    annullati: ordini.filter(o => o.stato === "annullato").length
  };
}

/* =========================================================
   ORDINI — Lista completa
========================================================= */
function getOrdiniLista() {
  const rows = db.prepare(`
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

  return rows.map(o => ({
    ...o,
    prodotti: safeParse(o.prodotti_json)
  }));
}

/* =========================================================
   EXPORT UNIFICATO
========================================================= */
function getDashboardData() {
  return {
    vendite: {
      kpi: getVenditeKPI(),
      vendite30: getVendite30(),
      topProdotti: getTopProdotti(),
      utm: getUTM()
      // volendo in futuro:
      // origini: getOriginiSintetiche()
    },
    ordini: {
      kpi: getOrdiniKPI(),
      lista: getOrdiniLista()
    }
  };
}

module.exports = {
  getVenditeKPI,
  getVendite30,
  getTopProdotti,
  getUTM,
  getOriginiSintetiche,
  getOrdiniKPI,
  getOrdiniLista,
  getDashboardData
};
