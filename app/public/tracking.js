// tracking.js — versione definitiva blindata + compatibile con server MAX

(function () {

  const TRACKING_ENABLED = true;

  /* =========================================================
     SANITIZZAZIONE
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  const cleanObj = (obj) => {
    if (!obj || typeof obj !== "object") return {};
    const out = {};
    for (const k in obj) {
      out[clean(k)] = clean(String(obj[k]));
    }
    return out;
  };

  /* =========================================================
     EVENT MAP (blindato)
  ========================================================== */
  const eventMap = {
    page_view: { description: "Visualizzazione pagina", params: ["path", "title"] },
    scroll_50: { description: "Scroll al 50%", params: [] },
    scroll_90: { description: "Scroll al 90%", params: [] },
    chat_opened: { description: "Apertura chat", params: ["page", "slug"] },
    chat_message_sent: { description: "Messaggio inviato", params: ["message"] },
    chat_message_received: { description: "Risposta bot", params: ["reply"] },
    product_view: { description: "Product card mostrata", params: ["product"] },
    product_buy_click: { description: "Click su Acquista", params: ["url"] },
    quick_reply_click: { description: "Quick reply cliccata", params: ["label"] },
    click_generic: { description: "Click generico", params: ["name", "extra"] },
    chat_error: { description: "Errore locale", params: ["error"] }
  };

  /* =========================================================
     STORAGE EVENTI (blindato)
  ========================================================== */
  const logs = [];

  function log(eventName, params = {}) {
    if (!TRACKING_ENABLED) return;

    const safeEvent = clean(eventName);
    const safeParams = cleanObj(params);

    const time = new Date().toISOString();
    const payload = { time, eventName: safeEvent, params: safeParams };

    logs.push(payload);

    console.log("%c[TRACKING]", "color:#0077ff;font-weight:bold;", payload);

    // GA4 client-side (blindato)
    try {
      if (typeof gtag === "function") {
        gtag("event", safeEvent, safeParams);
      }
    } catch (err) {
      console.warn("GA4 tracking error:", err);
    }
  }

  function getLogs() {
    return logs.slice().reverse();
  }

  /* =========================================================
     RENDER HTML (blindato)
  ========================================================== */
  function render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = getLogs();

    if (!data.length) {
      el.innerHTML = "<tr><td colspan='4'>Nessun evento registrato.</td></tr>";
      return;
    }

    let html = "";

    data.forEach(row => {
      const meta = eventMap[row.eventName] || {};
      html += `
        <tr>
          <td>${clean(row.time)}</td>
          <td>${clean(row.eventName)}</td>
          <td>${clean(meta.description || "")}</td>
          <td><pre>${clean(JSON.stringify(row.params, null, 2))}</pre></td>
        </tr>
      `;
    });

    el.innerHTML = html;
  }

  /* =========================================================
     PAGE VIEW → server (blindato)
  ========================================================== */
  document.addEventListener("DOMContentLoaded", () => {
    const path = clean(window.location.pathname);
    const slug = clean(new URLSearchParams(location.search).get("slug") || "");

    log("page_view", { path, title: clean(document.title) });

    try {
      const url = "/?page=" + encodeURIComponent(path) + (slug ? "&slug=" + encodeURIComponent(slug) : "");
      fetch(url, { method: "GET", credentials: "include" }).catch(() => {});
    } catch (err) {
      console.warn("Errore tracking server:", err);
    }
  });

  /* =========================================================
     SCROLL TRACKING (blindato)
  ========================================================== */
  let scroll50 = false;
  let scroll90 = false;

  window.addEventListener("scroll", () => {
    try {
      const h = document.documentElement;
      const scrolled = (h.scrollTop || document.body.scrollTop) / (h.scrollHeight - h.clientHeight);

      if (!scroll50 && scrolled >= 0.5) {
        scroll50 = true;
        log("scroll_50");
      }

      if (!scroll90 && scrolled >= 0.9) {
        scroll90 = true;
        log("scroll_90");
      }
    } catch (err) {
      log("chat_error", { error: "scroll_tracking_failed" });
    }
  });

  /* =========================================================
     CLICK GENERICO data-track (blindato)
  ========================================================== */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;

    const name = clean(el.getAttribute("data-track"));
    const extraRaw = el.getAttribute("data-track-extra");

    let extra = {};
    if (extraRaw) {
      try {
        extra = cleanObj(JSON.parse(extraRaw));
      } catch {
        extra = { raw: clean(extraRaw) };
      }
    }

    log("click_generic", { name, extra });
  });

  /* =========================================================
     API PUBBLICA (blindata)
  ========================================================== */
  window.TRACKING = Object.freeze({
    log,
    getLogs,
    render,
    eventMap
  });

})();
/* =========================================================
   EVENTI STORE (product view, add to cart, purchase)
========================================================= */

window.STORE_TRACKING = {
  productView(slug) {
    log("product_view", { product: clean(slug) });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "product_view",
        product: clean(slug),
        timestamp: new Date().toISOString()
      })
    }).catch(()=>{});
  },

  addToCart(product) {
    log("add_to_cart", { product: clean(product.slug) });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "add_to_cart",
        product: clean(product.slug),
        price: clean(product.prezzo),
        timestamp: new Date().toISOString()
      })
    }).catch(()=>{});
  },

  purchase(product, price) {
    log("purchase_complete", { product: clean(product), price: clean(price) });

    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "purchase_complete",
        product: clean(product),
        price: clean(price),
        timestamp: new Date().toISOString()
      })
    }).catch(()=>{});
  }
};
