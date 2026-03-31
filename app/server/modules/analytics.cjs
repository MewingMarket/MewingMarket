/**
 * =========================================================
 * File: app/server/modules/analytics.cjs
 * Modulo Analytics Unificato — Vendite + Ordini
 * Versione 2026.98 — SQL LIVE
 * =========================================================
 */

const db = require("../db/database.cjs");

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
   VENDITE — UTM performance
========================================================= */
function getUTM() {
  return db.prepare(`
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
  getOrdiniKPI,
  getOrdiniLista,
  getDashboardData
};
