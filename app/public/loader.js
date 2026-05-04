// =========================================================
// CRITICAL LOADER — MewingMarket
// Versione 2028.A-SAFE — Patch SUPREMA
// NON carica più il loader universale
// =========================================================

(function () {

  const VERSION = "20280412";

  console.log("[CRITICAL] Loader 2028.A avviato (SAFE)");

  /* ============================================================
     UTILITY
  ============================================================ */
  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function loadScriptSerial(src, where = "head") {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = resolve;
      s.onerror = resolve;
      (where === "body" ? document.body : document.head).appendChild(s);
    });
  }

  function fetchText(url) {
    return fetch(url).then(r => r.text());
  }

  /* ============================================================
     /api/ping — ANTI 502
  ============================================================ */
  function pingOnce() {
    return fetch("/api/ping")
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => true)
      .catch(() => false);
  }

  async function waitUntilServerReady() {
    for (let i = 0; i < 10; i++) {
      const ok = await pingOnce();
      if (ok) {
        console.log("[CRITICAL] /api/ping OK, procedo");
        return;
      }
      await wait(150);
    }
    console.warn("[CRITICAL] /api/ping non risponde — SAFE FALLBACK");
  }

  /* ============================================================
     AUTH
  ============================================================ */
  function loadAuth() {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `/auth.js?v=${VERSION}`;
      s.defer = true;
      s.onload = () => {
        console.log("[CRITICAL] auth.js caricato");
        resolve();
      };
      s.onerror = resolve;
      document.head.appendChild(s);
    });
  }

  /* ============================================================
     HEAD / HEADER / FOOTER
  ============================================================ */
  async function safeFetchAppendHeadSerial() {
    const urls = [`head.html?v=${VERSION}`, `/head.html?v=${VERSION}`];

    for (const url of urls) {
      try {
        const html = await fetchText(url);
        const temp = document.createElement("div");
        temp.innerHTML = html;

        [...temp.children].forEach(node => {
          if (node.tagName === "SCRIPT") {
            const s = document.createElement("script");
            s.text = node.text;
            document.head.appendChild(s);
          } else {
            document.head.appendChild(node);
          }
        });

        document.dispatchEvent(new Event("head-loaded"));
        console.log("[CRITICAL] head.html caricato");
        return true;
      } catch {}
    }

    console.error("[CRITICAL] head.html non caricato");
    return false;
  }

  async function safeFetchHeaderSerial() {
    const urls = [`header.html?v=${VERSION}`, `/header.html?v=${VERSION}`];

    for (const url of urls) {
      try {
        const html = await fetchText(url);
        const ph = document.getElementById("header-placeholder");
        if (ph) ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
        console.log("[CRITICAL] header.html caricato");
        return true;
      } catch {}
    }

    console.error("[CRITICAL] header.html non caricato");
    return false;
  }

  async function safeFetchFooterSerial() {
    const urls = [`footer.html?v=${VERSION}`, `/footer.html?v=${VERSION}`];

    for (const url of urls) {
      try {
        const html = await fetchText(url);
        const ph = document.getElementById("footer-placeholder");
        if (ph) ph.innerHTML = html;

        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();

        document.dispatchEvent(new Event("footer-loaded"));
        console.log("[CRITICAL] footer.html caricato");
        return true;
      } catch {}
    }

    console.error("[CRITICAL] footer.html non caricato");
    return false;
  }

  /* ============================================================
     SEQUENZA CRITICA
  ============================================================ */
  (async () => {
    try {
      await waitUntilServerReady();

      await loadScriptSerial("/seo.js");
      await loadScriptSerial("/structured-data.js");
      await loadScriptSerial("/tracking.js");

      await loadAuth();

      await safeFetchAppendHeadSerial();
      await safeFetchHeaderSerial();

      await loadScriptSerial("/header.js", "body");

      await safeFetchFooterSerial();

      await loadScriptSerial("/carrello.js", "body");

      /* ============================================================
         CRITICAL READY
      ============================================================ */
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
      console.log("[CRITICAL] critical-ready emesso");

      /* ============================================================
         ❌ RIMOSSO: caricamento loader universale
         Ora lo carica loadersupremo.js
      ============================================================ */

    } catch (err) {
      console.error("[CRITICAL] ERRORE NEL LOADER:", err);
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    }
  })();

})();
