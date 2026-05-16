/**
 * app/server/services/ga4.cjs
 * Tracking GA4 server-side (Versione 2027)
 */

const axios = require("axios");

const GA4_ID = process.env.GA4_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

/* ============================================================
   trackGA4 — Evento server-side
============================================================ */
async function trackGA4(eventName, params = {}) {
  try {
    // Se non configurato → ignora silenziosamente
    if (!GA4_ID || !GA4_API_SECRET) return false;

    // Client ID fallback
    const clientId = params.uid || params.user_id || "unknown";

    // Payload GA4
    const payload = {
      client_id: clientId,
      events: [
        {
          name: eventName,
          params
        }
      ]
    };

    // Chiamata GA4
    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_API_SECRET}`,
      payload
    );

    // Log interno (se definito)
    if (typeof global.logEvent === "function") {
      global.logEvent("ga4_event", { eventName, params });
    }

    return true;

  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err?.message || err);

    if (typeof global.logEvent === "function") {
      global.logEvent("ga4_error", {
        error: err?.message || "unknown",
        eventName
      });
    }

    return false;
  }
}

module.exports = { trackGA4 };
