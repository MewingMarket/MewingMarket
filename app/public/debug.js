// ======================================================
// 🔥 DEBUG UNIVERSALE — Attivo ovunque
// ======================================================

(function() {
  // Crea pannello debug
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
    console.log(msg);
    panel.textContent += msg + "\n";
    panel.scrollTop = panel.scrollHeight;
  }

  log("🔥 DEBUG UNIVERSALE ATTIVO");

  // Intercetta errori globali
  window.onerror = function(msg, url, line, col, error) {
    log(`❌ ERRORE GLOBALE: ${msg} @ ${url}:${line}:${col}`);
  };

  // Intercetta promise non gestite
  window.addEventListener("unhandledrejection", function(e) {
    log(`❌ PROMISE NON GESTITA: ${e.reason}`);
  });

  // Intercetta console.log / error / warn
  const origLog = console.log;
  console.log = function(...args) {
    origLog.apply(console, args);
    log("📗 LOG: " + args.join(" "));
  };

  const origErr = console.error;
  console.error = function(...args) {
    origErr.apply(console, args);
    log("❌ ERROR: " + args.join(" "));
  };

  const origWarn = console.warn;
  console.warn = function(...args) {
    origWarn.apply(console, args);
    log("⚠️ WARN: " + args.join(" "));
  };

  // Intercetta tutte le fetch
  const origFetch = window.fetch;
  window.fetch = async function(...args) {
    log("📡 FETCH → " + args[0]);

    try {
      const res = await origFetch.apply(this, args);
      log("📥 FETCH RESPONSE STATUS → " + res.status);

      // Clona la risposta per leggerla senza consumarla
      const clone = res.clone();
      const text = await clone.text();
      log("📥 FETCH RESPONSE BODY → " + text.substring(0, 500));

      return res;
    } catch (err) {
      log("❌ FETCH ERROR → " + err);
      throw err;
    }
  };

})();
