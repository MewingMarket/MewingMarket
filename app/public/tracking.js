tracking.js/* =========================================================
   TRACKING.JS — VERSIONE PREMIUM BLINDATA
   UTM + Funnel + Bot + FAQ + Lead Magnet + Newsletter
========================================================= */

let mmUID = null;
let mmUTM = {};

// Recupera UID dal cookie
function getUID() {
  const match = document.cookie.match(/mm_uid=([^;]+)/);
  return match ? match[1] : null;
}

mmUID = getUID();

/* =========================================================
   CARICA UTM SALVATI
========================================================= */
try {
  mmUTM = JSON.parse(localStorage.getItem("mm_utm") || "{}");
} catch {
  mmUTM = {};
}

/* =========================================================
   FUNZIONE BASE DI TRACKING
========================================================= */
function mmTrack(eventName, data = {}) {
  try {
    fetch("/tracking/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventName,
        uid: mmUID,
        utm: mmUTM,
        data
      })
    });
  } catch (err) {
    console.warn("Tracking error:", err);
  }
}
