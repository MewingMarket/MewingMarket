// =========================================================
// CRITICAL LOADER — MewingMarket
// Versione 2028.A-SAFE — Patch SUPREMA
// NON carica più il loader universale
// =========================================================

// Guardia anti-doppio-caricamento SEMPLICE
if (window.__CRITICAL_LOADER_2028A__) {
  console.warn("critical-loader-2028A.js già caricato, skip.");
} else {
  window.__CRITICAL_LOADER_2028A__ = true;

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

    async function fetchWithRetryHTML(urls, placeholderId, eventName, label, maxAttempts = 3) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        for (const url of urls) {
          try {
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) throw new Error("HTTP " + r.status);
            const html = await r.text();

            if (placeholderId) {
              const ph = document.getElementById(placeholderId);
              if (ph) ph.innerHTML = html;
            } else {
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
            }

            if (eventName) document.dispatchEvent(new Event(eventName));
            console.log(`[CRITICAL] ${label} OK da ${url} (tentativo ${attempt})`);
            return true;
          } catch (e) {
            console.warn(`[CRITICAL] ${label} FAIL da ${url} (tentativo ${attempt})`, e.message);
          }
        }
        await wait(200 * attempt); // backoff 200 / 400 / 600
      }
      console.error(`[CRITICAL] ${label} FALLITO dopo ${maxAttempts} tentativi`);
      return false;
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
    function safeFetchAppendHeadSerial() {
      return fetchWithRetryHTML(
        [`head.html?v=${VERSION}`, `/head.html?v=${VERSION}`],
        null,
        "head-loaded",
        "head.html"
      );
    }

    function safeFetchHeaderSerial() {
      return fetchWithRetryHTML(
        [`header.html?v=${VERSION}`, `/header.html?v=${VERSION}`],
        "header-placeholder",
        "header-loaded",
        "header.html"
      );
    }

    async function safeFetchFooterSerial() {
      const ok = await fetchWithRetryHTML(
        [`footer.html?v=${VERSION}`, `/footer.html?v=${VERSION}`],
        "footer-placeholder",
        "footer-loaded",
        "footer.html"
      );

      if (ok) {
        const year = document.getElementById("anno");
        if (year) year.textContent = new Date().getFullYear();
      }

      return ok;
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

        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
        console.log("[CRITICAL] critical-ready emesso");

      } catch (err) {
        console.error("[CRITICAL] ERRORE NEL LOADER:", err);
        window.__criticalReady = true;
        document.dispatchEvent(new Event("critical-ready"));
      }
    })();

  })();
}
