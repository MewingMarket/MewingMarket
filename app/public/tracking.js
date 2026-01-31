// tracking.js — VERSIONE MAX UNIFICATA
// Tracking locale + pannello HTML + event map + scroll + click + pageview

(function () {

  /* =========================================================
     CONFIG
  ========================================================= */
  const TRACKING_ENABLED = true;

  /* =========================================================
     EVENT MAP — tutti gli eventi supportati
  ========================================================= */
  const eventMap = {
    page_view: {
      description: "Visualizzazione pagina",
      params: ["path", "title"]
    },
    scroll_50: {
      description: "Scroll al 50%",
      params: []
    },
    scroll_90: {
      description: "Scroll al 90%",
      params: []
    },
    chat_opened: {
      description: "Apertura chat",
      params: ["page", "slug"]
    },
    chat_message_sent: {
      description: "Messaggio inviato dall’utente",
      params: ["message", "type"]
    },
    chat_message_received: {
      description: "Risposta generata dal bot",
      params: ["reply"]
    },
    product_view: {
      description: "Product card mostrata",
      params: ["product"]
    },
    product_buy_click: {
      description: "Click su Acquista",
      params: ["url"]
    },
    quick_reply_click: {
      description: "Quick reply cliccata",
      params: ["label"]
    },
    click_generic: {
      description: "Click generico data-track",
      params: ["name", "extra"]
    },
    chat_error: {
      description: "Errore locale",
      params: ["error"]
    }
  };

  /* =========================================================
     STORAGE EVENTI (solo sessione)
  ========================================================= */
  const logs = [];

  function log(eventName, params = {}) {
    if (!TRACKING_ENABLED) return;

    const time = new Date().toISOString();
    const payload = { time, eventName, params };

    logs.push(payload);

    console.log(
      "%c[TRACKING]",
      "color:#00eaff;font-weight:bold;",
      payload
    );

    // GA4 se presente
    if (typeof gtag === "function") {
      gtag("event", eventName, params);
    }
  }

  function getLogs() {
    return logs.slice().reverse();
  }

  /* =========================================================
     RENDER HTML — stampa tabella nel pannello
  ========================================================= */
  function render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = getLogs();

    if (!data.length) {
      el.innerHTML = "<p>Nessun evento registrato.</p>";
      return;
    }

    let html = `
      <table border="1" cellspacing="0" cellpadding="6" style="width:100%; font-family:system-ui; font-size:14px;">
        <thead>
          <tr>
            <th>Data</th>
            <th>Evento</th>
            <th>Descrizione</th>
            <th>Parametri</th>
          </tr>
        </thead>
        <tbody>
    `;

    data.forEach(row => {
      const meta = eventMap[row.eventName] || {};
      html += `
        <tr>
          <td>${row.time}</td>
          <td>${row.eventName}</td>
          <td>${meta.description || ""}</td>
          <td><pre style="margin:0; white-space:pre-wrap;">${JSON.stringify(row.params, null, 2)}</pre></td>
        </tr>
      `;
    });

    html += `
        </tbody>
      </table>
    `;

    el.innerHTML = html;
  }

  /* =========================================================
     PAGE VIEW
  ========================================================= */
  document.addEventListener("DOMContentLoaded", () => {
    log("page_view", {
      path: window.location.pathname,
      title: document.title
    });
  });

  /* =========================================================
     SCROLL TRACKING
  ========================================================= */
  let scroll50 = false;
  let scroll90 = false;

  window.addEventListener("scroll", () => {
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
  });

  /* =========================================================
     CLICK GENERICO data-track
  ========================================================= */
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;

    const name = el.getAttribute("data-track");
    const extra = el.getAttribute("data-track-extra");

    let data = {};
    if (extra) {
      try { data = JSON.parse(extra); } catch {}
    }

    log("click_generic", { name, extra: data });
  });

  /* =========================================================
     API PUBBLICA PER chat.js e altri script
  ========================================================= */
  window.TRACKING = {
    log,
    getLogs,
    render,
    eventMap
  };

})();
