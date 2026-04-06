// =========================================================
// tracking.js — Versione SAFE (2026)
// Placeholder universale per evitare errori e mantenere
// compatibilità con vecchi moduli e logiche di tracciamento.
// =========================================================

// Evento generico (compatibile con vecchi sistemi)
window.track = function(eventName, data = {}) {
  console.log("[TRACK]", eventName, data);
};

// Evento strutturato (compatibile con product-page.cjs)
window.logEvent = function(eventName, data = {}) {
  console.log("[LOG EVENT]", eventName, data);
};

// Evita errori se qualcuno richiama funzioni legacy
window.analytics = {
  event: (name, data) => console.log("[ANALYTICS EVENT]", name, data),
  pageview: (url) => console.log("[ANALYTICS PAGEVIEW]", url || location.href)
};
