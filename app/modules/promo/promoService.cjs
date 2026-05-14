/**
 * promoService.cjs — Sistema Promozioni 2027
 * Path: app/modules/promo/promoService.cjs
 *
 * Gestisce:
 * - Livelli utente (base, medio, avanzato, pro)
 * - KPI vendite (prodotti poco venduti)
 * - Prodotti già acquistati dall’utente
 * - Generazione promozioni
 * - Applicazione sconti al catalogo
 */

const path = require("path");
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

/* ============================================================
   1) LETTURA LIVELLO UTENTE
============================================================ */
function getLivelloUtente(userId) {
  const row = db.prepare(`
    SELECT 
      COUNT(*) AS ordini,
      COALESCE(SUM(totale_cent), 0) AS spesa
    FROM ordini
    WHERE utente_id = ?
  `).get(userId);

  const ordini = row.ordini;
  const spesa = row.spesa / 100;

  if (ordini === 0) return "base";
  if (ordini < 3) return "medio";
  if (ordini < 7) return "avanzato";
  return "pro";
}

/* ============================================================
   2) PRODOTTI GIÀ ACQUISTATI DALL’UTENTE
============================================================ */
function getProdottiAcquistati(userId) {
  const rows = db.prepare(`
    SELECT prodotti_json
    FROM ordini
    WHERE utente_id = ?
  `).all(userId);

  const ids = new Set();

  rows.forEach(r => {
    try {
      const arr = JSON.parse(r.prodotti_json);
      arr.forEach(p => ids.add(p.id));
    } catch {}
  });

  return Array.from(ids);
}

/* ============================================================
   3) PRODOTTI POCO VENDUTI (KPI)
============================================================ */
function getProdottiPocoVenduti() {
  const rows = db.prepare(`
    SELECT prodotto_id, COUNT(*) AS vendite
    FROM vendite
    GROUP BY prodotto_id
    ORDER BY vendite ASC
  `).all();

  return rows.map(r => r.prodotto_id);
}

/* ============================================================
   4) CREA PROMOZIONE
============================================================ */
function creaPromozione(userId) {
  const livello = getLivelloUtente(userId);
  const acquistati = getProdottiAcquistati(userId);
  const pocoVenduti = getProdottiPocoVenduti();
  const prodotti = catalogo.getAllProducts();

  let promo = {
    user_id: userId,
    livello,
    tipo: null,
    prodotto_id: null,
    sconto_percent: 0,
    sconto_catalogo_percent: 0,
    sconto_carrello_percent: 0,
    sconto_novita_percent: 0,
    scadenza: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    attiva: 1
  };

  /* ============================================================
     LIVELLO BASE — Sconto su 1 prodotto poco venduto
  ============================================================= */
  if (livello === "base") {
    promo.tipo = "single_product";
    promo.sconto_percent = 20;

    const target = pocoVenduti.find(id => !acquistati.includes(id));
    promo.prodotto_id = target || null;
  }

  /* ============================================================
     LIVELLO MEDIO — Sconto globale
  ============================================================= */
  if (livello === "medio") {
    promo.tipo = "global";
    promo.sconto_catalogo_percent = 10;
  }

  /* ============================================================
     LIVELLO AVANZATO — Sconto novità
  ============================================================= */
  if (livello === "avanzato") {
    promo.tipo = "new_only";
    promo.sconto_novita_percent = 15;
  }

  /* ============================================================
     LIVELLO PRO — Tutto scontato + extra carrello + novità
  ============================================================= */
  if (livello === "pro") {
    promo.tipo = "pro_full";
    promo.sconto_catalogo_percent = 20;
    promo.sconto_carrello_percent = 10;
    promo.sconto_novita_percent = 15;
  }

  // Salva nel DB
  const stmt = db.prepare(`
    INSERT INTO promozioni (
      user_id, livello, tipo, prodotto_id,
      sconto_percent, sconto_catalogo_percent,
      sconto_carrello_percent, sconto_novita_percent,
      scadenza, attiva
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    promo.user_id,
    promo.livello,
    promo.tipo,
    promo.prodotto_id,
    promo.sconto_percent,
    promo.sconto_catalogo_percent,
    promo.sconto_carrello_percent,
    promo.sconto_novita_percent,
    promo.scadenza,
    promo.attiva
  );

  return promo;
}

/* ============================================================
   5) LEGGI PROMO ATTIVA
============================================================ */
function getPromoAttiva(userId) {
  return db.prepare(`
    SELECT *
    FROM promozioni
    WHERE user_id = ? AND attiva = 1
    ORDER BY id DESC
    LIMIT 1
  `).get(userId);
}

/* ============================================================
   6) APPLICA SCONTI AL CATALOGO
============================================================ */
function applicaSconti(prodotti, promo, userId) {
  const acquistati = getProdottiAcquistati(userId);

  return prodotti.map(p => {
    const clone = { ...p };

    // Nessuna promo
    if (!promo) return clone;

    clone.promo_attiva = true;
    clone.promo_badge = promo.livello.toUpperCase();

    /* ============================================================
       SINGLE PRODUCT
    ============================================================= */
    if (promo.tipo === "single_product" && p.id === promo.prodotto_id) {
      clone.prezzo_scontato_cent = Math.round(
        p.prezzo_cent * (1 - promo.sconto_percent / 100)
      );
    }

    /* ============================================================
       GLOBAL
    ============================================================= */
    if (promo.tipo === "global") {
      clone.prezzo_scontato_cent = Math.round(
        p.prezzo_cent * (1 - promo.sconto_catalogo_percent / 100)
      );
    }

    /* ============================================================
       NEW ONLY
    ============================================================= */
    if (promo.tipo === "new_only" && p.is_new) {
      clone.prezzo_scontato_cent = Math.round(
        p.prezzo_cent * (1 - promo.sconto_novita_percent / 100)
      );
    }

    /* ============================================================
       PRO FULL
    ============================================================= */
    if (promo.tipo === "pro_full") {
      clone.prezzo_scontato_cent = Math.round(
        p.prezzo_cent * (1 - promo.sconto_catalogo_percent / 100)
      );
    }

    return clone;
  });
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  getLivelloUtente,
  getProdottiAcquistati,
  getProdottiPocoVenduti,
  creaPromozione,
  getPromoAttiva,
  applicaSconti
};
