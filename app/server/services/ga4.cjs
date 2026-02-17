/**
 * app/server/services/ga4.cjs
 * Tracking GA4 server-side
 */

const axios = require("axios");

const GA4_ID = process.env.GA4_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

async function trackGA4(eventName, params = {}) {
  try {
    if (!GA4_ID || !GA4_API_SECRET) return;

    await axios.post(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA4_ID}&api_secret=${GA4_API_SECRET}`,
      {
        client_id: params.uid || "unknown",
        events: [{ name: eventName, params }]
      }
    );

    if (typeof global.logEvent === "function") {
      global.logEvent("ga4_event", { eventName, params });
    }

  } catch (err) {
    console.error("GA4 tracking error:", err?.response?.data || err?.message || err);

    if (typeof global.logEvent === "function") {
      global.logEvent("ga4_error", {
        error: err?.message || "unknown",
        eventName
      });
    }
  }
}

module.exports = { trackGA4 };
