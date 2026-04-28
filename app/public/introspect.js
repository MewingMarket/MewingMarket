/* FILE: app/public/introspect.js
   PERCORSO: /app/public/introspect.js
   RUOLO: JS → legge il frontend, invia al backend, riceve match
*/

(function () {

  console.log("[INTROSPECT] Avvio motore frontend…");

  // ============================================================
  // 1) Trova tutte le fetch nel frontend
  // ============================================================
  function scanFetches() {
    const results = [];
    const scripts = document.querySelectorAll("script[src]");

    scripts.forEach(s => {
      // Evita introspect stesso
      if (s.src.includes("introspect")) return;

      fetch(s.src)
        .then(r => r.text())
        .then(code => {
          const regex = /fetch\(\s*["'`](.*?)["'`]/g;
          let m;
          while ((m = regex.exec(code)) !== null) {
            results.push(m[1]);
          }
        });
    });

    return new Promise(resolve => setTimeout(() => resolve(results), 500));
  }

  // ============================================================
  // 2) Trova HTML, JS, JSON referenziati
  // ============================================================
  function scanStatic() {
    const html = [];
    const js = [];
    const json = [];

    document.querySelectorAll("script[src]").forEach(s => {
      if (!s.src.includes("introspect")) js.push(new URL(s.src).pathname);
    });

    document.querySelectorAll("link[rel='stylesheet']").forEach(l => {
      html.push(new URL(l.href).pathname);
    });

    return { html, js, json };
  }

  // ============================================================
  // 3) Invia tutto al backend
  // ============================================================
  async function sendToBackend(payload) {
    try {
      const res = await fetch("/introspect/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      return await res.json();
    } catch (err) {
      console.error("[INTROSPECT] Errore comunicazione backend:", err);
      return {};
    }
  }

  // ============================================================
  // 4) Avvio
  // ============================================================
  async function start() {
    const fetches = await scanFetches();
    const staticFiles = scanStatic();

    const payload = {
      api: fetches.filter(f => f.startsWith("/api")),
      html: staticFiles.html,
      js: staticFiles.js,
      json: staticFiles.json
    };

    console.log("[INTROSPECT] Payload:", payload);

    const match = await sendToBackend(payload);

    console.log("[INTROSPECT] Match ricevuto:", match);

    window.__match = match;
    document.dispatchEvent(new Event("introspect-ready"));
  }

  start();

})();
