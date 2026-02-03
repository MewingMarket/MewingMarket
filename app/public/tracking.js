/* =========================================================
   TRACKING.JS — VERSIONE PREMIUM BLINDATA
   UTM + Funnel + Bot + FAQ + Lead Magnet + Newsletter + Store
   Canale automatico + PageView + Click + Scroll + Errori
========================================================= */

let mmUID = null;
let mmUTM = {};
let mmSessionStart = Date.now();

/* =========================================================
   UID DAL COOKIE
========================================================= */
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
   SALVA UTM SE PRESENTI NELL’URL
========================================================= */
(function captureUTM() {
  if (typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"];

  let found = false;
  keys.forEach(k => {
    const v = params.get(k);
    if (v) {
      mmUTM[k] = v;
      found = true;
    }
  });

  if (found) {
    localStorage.setItem("mm_utm", JSON.stringify(mmUTM));
  }
})();

/* =========================================================
   RILEVAZIONE CANALE AUTOMATICA
========================================================= */
function mmDetectChannel() {
  if (typeof document === "undefined") return "system";

  const ref = document.referrer || "";
  const host = location.hostname || "";

  if (ref.includes("instagram.com") || ref.includes("l.instagram.com")) return "social";
  if (ref.includes("tiktok.com")) return "social";
  if (ref.includes("facebook.com") || ref.includes("m.facebook.com")) return "social";
  if (ref.includes("youtube.com") || ref.includes("youtu.be")) return "social";

  if (ref.includes("mail.") || ref.includes("newsletter") || mmUTM.utm_source === "newsletter")
    return "newsletter";

  if (host.includes("payhip.com")) return "store";

  return "site";
}

/* =========================================================
   FUNZIONE BASE DI TRACKING (VERSIONE MAX)
========================================================= */
function mmTrack(eventName, data = {}, options = {}) {
  try {
    const payload = {
      event: eventName,
      uid: mmUID,
      utm: mmUTM,
      data,
      page: (typeof location !== "undefined") ? location.pathname + location.search : null,
      referrer: (typeof document !== "undefined") ? document.referrer : null,
      userAgent: (typeof navigator !== "undefined") ? navigator.userAgent : null,
      channel: options.channel || mmDetectChannel(),
      source: options.source || mmUTM.utm_source || null,
      type: options.type || "generic",
      time: new Date().toISOString(),
      session_ms: Date.now() - mmSessionStart
    };

    fetch("/tracking/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch(() => {});
  } catch (err) {
    console.warn("Tracking error:", err);
  }
}

/* =========================================================
   PAGE VIEW AUTOMATICO
========================================================= */
(function autoPageView() {
  if (typeof window === "undefined") return;
  mmTrack("page_view", {}, { type: "site" });
})();

/* =========================================================
   CLICK TRACKING AUTOMATICO
========================================================= */
document.addEventListener("click", (e) => {
  try {
    const target = e.target.closest("[data-track]");
    if (!target) return;

    mmTrack("click", {
      track_id: target.getAttribute("data-track"),
      text: target.innerText || null
    }, { type: "site" });
  } catch {}
});

/* =========================================================
   SCROLL TRACKING (25% / 50% / 75% / 100%)
========================================================= */
let scrollMilestones = {25:false,50:false,75:false,100:false};

window.addEventListener("scroll", () => {
  const h = document.documentElement;
  const percent = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;

  [25,50,75,100].forEach(m => {
    if (!scrollMilestones[m] && percent >= m) {
      scrollMilestones[m] = true;
      mmTrack("scroll", { milestone: m }, { type: "site" });
    }
  });
});

/* =========================================================
   ERROR TRACKING
========================================================= */
window.addEventListener("error", (e) => {
  mmTrack("js_error", {
    message: e.message,
    file: e.filename,
    line: e.lineno,
    col: e.colno
  }, { type: "system" });
});

/* =========================================================
   BOT TRACKING (API PER IL BOT)
========================================================= */
window.mmBotTrack = {
  intent(intentName, confidence = null) {
    mmTrack("intent_detected", { intent: intentName, confidence }, { type: "bot" });
  },
  message(role, text) {
    mmTrack("bot_message", { role, text }, { type: "bot" });
  },
  fallback(userText) {
    mmTrack("bot_fallback", { userText }, { type: "bot" });
  }
};

/* =========================================================
   LEAD MAGNET TRACKING
========================================================= */
window.mmLead = {
  download(name) {
    mmTrack("lead_download", { name }, { type: "site" });
  },
  email(email) {
    mmTrack("lead_email", { email }, { type: "site" });
  }
};

/* =========================================================
   NEWSLETTER TRACKING
========================================================= */
window.mmNewsletter = {
  subscribe(email) {
    mmTrack("newsletter_subscribe", { email }, { type: "newsletter" });
  },
  unsubscribe(email) {
    mmTrack("newsletter_unsubscribe", { email }, { type: "newsletter" });
  }
};

/* =========================================================
   STORE TRACKING (PER PAYHIP)
========================================================= */
window.mmStore = {
  purchase(product_id, product_name, price, currency = "EUR") {
    mmTrack("purchase", {
      product_id,
      product_name,
      price,
      currency
    }, { type: "store", channel: "store", source: "payhip" });
  }
};
