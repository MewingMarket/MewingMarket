/**
 * =========================================================
 * File: app/server/modules/tracking-sql.cjs
 * Tracking eventi store interno (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

function trackEvent({
  event,
  prodotto_id = null,
  utm_source = null,
  utm_medium = null,
  utm_campaign = null,
  referrer = null,
  user_agent = null,
  session_id = null,
  ip = null
}) {
  try {
    const stmt = db.prepare(`
      INSERT INTO tracking (
        event,
        prodotto_id,
        utm_source,
        utm_medium,
        utm_campaign,
        referrer,
        user_agent,
        session_id,
        ip
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event,
      prodotto_id,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
      user_agent,
      session_id,
      ip
    );

  } catch (err) {
    console.error("❌ tracking-sql error:", err);
  }
}

module.exports = { trackEvent };
