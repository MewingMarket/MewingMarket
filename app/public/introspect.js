/* =========================================================
   INTROSPECT FRONTEND — Versione 2027.70
   Compatibile con:
   - router universale 2027.901
   - universal-json
   - diagnostica filtrata
   - introspect-endpoints 2027.50
========================================================= */

(function () {

  console.log("🟦 [INTROSPECT] Avvio motore frontend…");

  /* ============================================================
     1) Normalizzazione URL
  ============================================================ */
  function normalize(url) {
    if (!url) return "";
    url = url.split("?")[0];
    url = url.replace(/\$\{[^}]+\}/g, "");
    url = url.replace(/\/+/g, "/");
    if (url.length > 1 && url.endsWith("/")) url = url.slice(0, -1);
    return url.toLowerCase();
  }

  /* ============================================================
     2) Scansione fetch nel frontend
     (compatibile universal-json → ignora HTML)
  ============================================================ */
  async function scanFetches() {
    const results = [];
    const scripts = document.querySelectorAll("script[src]");

    const tasks = [...scripts].map(s => {
      if (s.src.includes("introspect")) return null;

      return fetch(s.src)
        .then(r => r.ok ? r.text() : "")
        .then(code => {
          if (!code || code.trim().startsWith("<")) return; // HTML → ignora

          const regex = /fetch\s*\(\s*["'`](.*?)["'`]/g;
          let m;
          while ((m = regex.exec(code))) {
            const url = normalize(m[1]);
            if (url.startsWith("/api/")) results.push(url);
          }
        })
        .catch(() => {});
    });

    await Promise.all(tasks);
    return [...new Set(results)];
  }

  /* ============================================================
     3) Scansione file statici (solo pathname)
  ============================================================ */
  function scanStatic() {
    const html = [];
    const js = [];
    const json = [];

    document.querySelectorAll("script[src]").forEach(s => {
      if (!s.src.includes("introspect")) {
        js.push(new URL(s.src).pathname);
      }
    });

    document.querySelectorAll("link[rel='stylesheet']").forEach(l => {
      html.push(new URL(l.href).pathname);
    });

    return { html, js, json };
  }

  /* ============================================================
     4) Invio al backend
  ============================================================ */
  async function sendToBackend(payload) {
    try {
      const res = await fetch("/introspect/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      return await res.json();
    } catch (err) {
      console.error("🟥 [INTROSPECT] Errore comunicazione backend:", err);
      return {};
    }
  }

  /* ============================================================
     5) Avvio
  ============================================================ */
  async function start() {
    const apiCalls = await scanFetches();
    const staticFiles = scanStatic();

    const payload = {
      api: apiCalls,
      html: staticFiles.html,
      js: staticFiles.js,
      json: staticFiles.json
    };

    console.log("🟦 [INTROSPECT] Payload:", payload);

    const match = await sendToBackend(payload);

    console.log("🟩 [INTROSPECT] Match ricevuto:", match);

    window.__match = match;
    document.dispatchEvent(new Event("introspect-ready"));
  }

  start();

})();
