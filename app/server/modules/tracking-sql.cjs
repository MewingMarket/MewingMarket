/**
 * =========================================================
 * File: app/server/modules/tracking-sql.cjs
 * Tracking vendite (SQL) — usa tabella "vendite"
 * =========================================================
 */

const db = require("../db/database.cjs");

/**
 * Registra una vendita nella tabella "vendite"
 *
 * @param {Object} data
 * @param {string} data.uid - ID univoco ordine (paypal, stripe, ecc.)
 * @param {number} data.prodotto_id - ID prodotto
 * @param {number} data.prezzo_cent - prezzo in centesimi
 * @param {string|null} data.origine - es: "paypal", "stripe", "manuale"
 * @param {string|null} data.utm_source
 * @param {string|null} data.utm_campaign
 * @param {string|null} data.utm_medium
 * @param {string|null} data.referrer
 */
function trackEvent({
  uid,
  prodotto_id,
  prezzo_cent,
  origine = null,
  utm_source = null,
  utm_campaign = null,
  utm_medium = null,
  referrer = null
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO vendite (
        uid,
        prodotto_id,
        prezzo_cent,
        origine,
        utm_source,
        utm_campaign,
        utm_medium,
        referrer
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      uid,
      prodotto_id,
      prezzo_cent,
      origine,
      utm_source,
      utm_campaign,
      utm_medium,
      referrer
    );

  } catch (err) {
    console.error("❌ trackEvent (vendite) error:", err);
  }
}

module.exports = { trackEvent };
