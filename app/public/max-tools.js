// public/max-tools.js
// Pannello tracking locale — MAX MODE

(function () {
  const eventMap = {
    chat_message_sent: {
      description: "Messaggio inviato dall’utente",
      params: ["uid", "message"]
    },
    chat_message_received: {
      description: "Risposta generata dal bot",
      params: ["uid", "intent", "sub"]
    },
    intent_detected: {
      description: "Intent rilevato dal bot",
      params: ["uid", "intent", "sub"]
    },
    page_view: {
      description: "Pagina o prodotto visualizzato",
      params: ["uid", "page", "slug"]
    },
    product_view: {
      description: "Prodotto visualizzato nel bot",
      params: ["uid", "product_slug"]
    },
    chat_error: {
      description: "Errore interno del bot",
      params: ["error"]
    }
  };

  const logs = [];

  function log(eventName, params = {}) {
    const time = new Date().toISOString();
    logs.push({ time, eventName, params });

    // opzionale: anche console
    console.log("[MAX TRACK]", time, eventName, params);
  }

  function getLogs() {
    return logs.slice().reverse();
  }

  function render(containerId) {
    const el = document.getElementById(containerId);
    if (!el) return;

    const data = getLogs();

    if (!data.length) {
      el.innerHTML = "<p>Nessun evento tracciato ancora.</p>";
      return;
    }

    let html = `
      <table border="1" cellspacing="0" cellpadding="6" style="width:100%; font-family:system-ui; font-size:14px;">
        <thead>
          <tr>
            <th>Ora</th>
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

  window.MAX_TRACKING = {
    eventMap,
    log,
    getLogs,
    render
  };
})();
