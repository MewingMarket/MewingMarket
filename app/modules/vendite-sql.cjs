// =========================================================
// File: app/modules/vendite-sql.cjs
// Vendite — Versione SQL definitiva
// =========================================================

const db = require("../db/database.cjs");

// =========================================================
// REGISTRA VENDITA
// =========================================================
function registraVendita({ uid, prodotto_id, prezzo_cent, origine, utm_source, utm_campaign, utm_medium, referrer }) {
  db.prepare(`
    INSERT INTO vendite (
      uid, prodotto_id, prezzo_cent, origine,
      utm_source, utm_campaign, utm_medium, referrer
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    uid,
    prodotto_id,
    prezzo_cent,
    origine,
    utm_source,
    utm_campaign,
    utm_medium,
    referrer
  );
}

// =========================================================
// GET VENDITE BY UID
// =========================================================
function getVenditeByUID(uid) {
  return db.prepare("SELECT * FROM vendite WHERE uid = ? ORDER BY id DESC").all(uid);
}

// =========================================================
// GET VENDITE BY PRODOTTO
// =========================================================
function getVenditeByProdotto(id) {
  return db.prepare("SELECT * FROM vendite WHERE prodotto_id = ? ORDER BY id DESC").all(id);
}

// =========================================================
// GET VENDITE TOTALI
// =========================================================
function getVenditeTotali() {
  return db.prepare("SELECT COUNT(*) AS totale FROM vendite").get().totale;
}

// =========================================================
// UPDATE PAYPAL LINK
// =========================================================
function updatePayPalLink(prodotto_id, paypal_link) {
  db.prepare(`
    UPDATE prodotti SET paypal_link = ? WHERE id = ?
  `).run(paypal_link, prodotto_id);
}

module.exports = {
  registraVendita,
  getVenditeByUID,
  getVenditeByProdotto,
  getVenditeTotali,
  updatePayPalLink
};
