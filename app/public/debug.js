// ======================================================
// 🔥 DEBUG UNIVERSALE — Attivo ovunque
// ======================================================

(function() {

  // ======================================================
  // 🔥 FUNZIONE PER INVIARE LOG AL BACKEND
  // ======================================================
  function sendToBackend(type, message) {
    fetch("/debug/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, message })
    }).catch(() => {});
  }

  // ======================================================
  // 🔥 CREA PANNELLO DEBUG
  // ======================================================
  const panel = document.createElement("div");
  panel.style.position = "fixed";
  panel.style.bottom = "0";
  panel.style.left = "0";
  panel.style.width = "100%";
  panel.style.maxHeight = "40vh";
  panel.style.overflowY = "auto";
  panel.style.background = "rgba(0,0,0,0.85)";
  panel.style.color = "#0f0";
  panel.style.fontSize = "12px";
  panel.style.fontFamily = "monospace";
  panel.style.zIndex = "999999";
  panel.style.padding = "10px";
  panel.style.whiteSpace = "pre-wrap";
  panel.style.borderTop = "2px solid #0f0";
  panel.id = "debug-panel";
  document.body.appendChild(panel);

  function log(msg) {
    panel.textContent += msg + "\n";
    panel.scrollTop = panel.scrollHeight;

    // 🔥 Invia anche al backend
    sendToBackend("frontend-log", msg);
  }

  log("🔥 DEBUG UNIVERSALE ATTIVO");

  // ======================================================
  // 🔥 Intercetta errori globali
  // ======================================================
  window.onerror = function(msg, url, line, col, error) {
    const text = `❌ ERRORE GLOBALE: ${msg} @ ${url}:${line}:${col}`;
    log(text);
    sendToBackend("frontend-error", text);
  };

  // ======================================================
  // 🔥 Intercetta promise non gestite
  // ======================================================
  window.addEventListener("unhandledrejection", function(e) {
    const text = `❌ PROMISE NON GESTITA: ${e.reason}`;
    log(text);
    sendToBackend("frontend-error", text);
  });

  // ======================================================
  // 🔥 Intercetta console.log / error / warn
  // ======================================================
  const origLog = console.log;
  console.log = function(...args) {
    const text = "📗 LOG: " + args.join(" ");
    origLog.apply(console, args);
    log(text);
    sendToBackend("frontend-log", text);
  };

  const origErr = console.error;
  console.error = function(...args) {
    const text = "❌ ERROR: " + args.join(" ");
    origErr.apply(console, args);
    log(text);
    sendToBackend("frontend-error", text);
  };

  const origWarn = console.warn;
  console.warn = function(...args) {
    const text = "⚠️ WARN: " + args.join(" ");
    origWarn.apply(console, args);
    log(text);
    sendToBackend("frontend-warn", text);
  };

  // ======================================================
  // 🔥 Intercetta tutte le fetch
  // ======================================================
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    const url = args[0];
    log("📡 FETCH → " + url);
    sendToBackend("frontend-fetch", "FETCH → " + url);

    try {
      const res = await origFetch.apply(this, args);

      log("📥 FETCH RESPONSE STATUS → " + res.status);
      sendToBackend("frontend-fetch-status", res.status);

      const clone = res.clone();
      const text = await clone.text();
      const preview = text.substring(0, 500);

      log("📥 FETCH RESPONSE BODY → " + preview);
      sendToBackend("frontend-fetch-body", preview);

      return res;
    } catch (err) {
      const text = "❌ FETCH ERROR → " + err;
      log(text);
      sendToBackend("frontend-fetch-error", text);
      throw err;
    }
  };

})();
