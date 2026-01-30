// public/tracking.js

// === CONFIG BASE ===
const TRACKING_ENABLED = true;

// Se vuoi, qui puoi aggiungere invio a endpoint tuo /tracking
function sendEvent(name, data = {}) {
  if (!TRACKING_ENABLED) return;

  const payload = {
    name,
    data,
    url: window.location.pathname,
    ts: Date.now()
  };

  // GA4 (gtag) se presente
  if (typeof gtag === "function") {
    gtag("event", name, data || {});
  }

  // Console per debug
  console.log("📊 EVENT:", payload);
}

// === PAGE VIEW ===
document.addEventListener("DOMContentLoaded", () => {
  sendEvent("page_view", {
    path: window.location.pathname,
    title: document.title
  });
});

// === SCROLL (50% / 90%) ===
let scroll50 = false;
let scroll90 = false;

window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const scrolled = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);

  if (!scroll50 && scrolled >= 0.5) {
    scroll50 = true;
    sendEvent("scroll_50");
  }

  if (!scroll90 && scrolled >= 0.9) {
    scroll90 = true;
    sendEvent("scroll_90");
  }
});

// === CLICK GENERICO CON DATA-TRACK ===
// es: <a data-track="footer_click_contatti">
document.addEventListener("click", (e) => {
  const el = e.target.closest("[data-track]");
  if (!el) return;

  const name = el.getAttribute("data-track");
  const extra = el.getAttribute("data-track-extra");

  let data = {};
  if (extra) {
    try { data = JSON.parse(extra); } catch {}
  }

  sendEvent(name, data);
});

// === API PUBBLICA PER GLI ALTRI SCRIPT ===
window.trackEvent = function(name, data = {}) {
  sendEvent(name, data);
};
