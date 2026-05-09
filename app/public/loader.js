// =========================================================
// CRITICAL LOADER — MewingMarket
// Versione 2028.A HYBRID MODE (SAFE + HARD + ULTRA FAST)
// =========================================================

if (window.__CRITICAL_LOADER_2028A__) {
  console.warn("critical-loader-2028A.js già caricato, skip.");
} else {
  window.__CRITICAL_LOADER_2028A__ = true;

  (function () {

    const VERSION = "20280412";

    console.log("[CRITICAL] Loader 2028.A HYBRID MODE");

    /* ============================================================
       PRELOAD AGGRESSIVO
    ============================================================ */
    [
      "/seo.js",
      "/structured-data.js",
      "/tracking.js",
      "/auth.js",
      "/head.html",
      "/header.html",
      "/footer.html",
      "/header.js",
      "/carrello.js"
    ].forEach(src => {
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = src.endsWith(".html") ? "fetch" : "script";
      link.href = `${src}?v=${VERSION}`;
      link.fetchPriority = "high";
      document.head.appendChild(link);
    });

    /* ============================================================
       UTILITY
    ============================================================ */
    const wait = ms => new Promise(r => setTimeout(r, ms));

    function loadScriptSerial(src, where = "head") {
      return new Promise(resolve => {
        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = true;
        s.fetchPriority = "high";
        s.onload = () => resolve(true);
        s.onerror = () => resolve(false);
        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    async function fetchHTMLWithRetry(urls, placeholderId, eventName, label, maxAttempts = 4) {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        for (const url of urls) {
          try {
            const r = await fetch(url, { cache: "no-store" });
            if (!r.ok) throw new Error("HTTP " + r.status);

            const html = await r.text();
            const ph = placeholderId ? document.getElementById(placeholderId) : null;

            if (ph) {
              ph.innerHTML = html;
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
        await wait(200 * attempt);
      }
      console.error(`[CRITICAL] ${label} FALLITO dopo ${maxAttempts} tentativi`);
      return false;
    }

    /* ============================================================
       /api/ping — ANTI 502 (HYBRID)
    ============================================================ */
    async function waitUntilServerReady() {
      for (let i = 0; i < 10; i++) {
        try {
          const r = await fetch("/api/ping", { cache: "no-store" });
          if (r.ok) {
            console.log("[CRITICAL] /api/ping OK");
            return true;
          }
        } catch {}
        await wait(120);
      }
      console.warn("[CRITICAL] /api/ping non risponde — fallback");
      return false;
    }

    /* ============================================================
       SEQUENZA CRITICA — HYBRID MODE
    ============================================================ */
    (async () => {
      let ok = true;

      await waitUntilServerReady();

      ok &= await loadScriptSerial("/seo.js");
      ok &= await loadScriptSerial("/structured-data.js");
      ok &= await loadScriptSerial("/tracking.js");

      ok &= await loadScriptSerial("/auth.js");

      ok &= await fetchHTMLWithRetry(
        [`/head.html?v=${VERSION}`, `head.html?v=${VERSION}`],
        null,
        "head-loaded",
        "head.html"
      );

      ok &= await fetchHTMLWithRetry(
        [`/header.html?v=${VERSION}`, `header.html?v=${VERSION}`],
        "header-placeholder",
        "header-loaded",
        "header.html"
      );

      ok &= await loadScriptSerial("/header.js", "body");

      ok &= await fetchHTMLWithRetry(
        [`/footer.html?v=${VERSION}`, `footer.html?v=${VERSION}`],
        "footer-placeholder",
        "footer-loaded",
        "footer.html"
      );

      ok &= await loadScriptSerial("/carrello.js", "body");

      /* ============================================================
         EMISSIONE CRITICAL-READY — HYBRID MODE
      ============================================================ */
      if (ok) {
        console.log("🟩 [CRITICAL] critical-ready (HYBRID, FULL OK)");
      } else {
        console.warn("🟧 [CRITICAL] critical-ready (HYBRID, DEGRADED MODE)");
      }

      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    })();

  })();
}
