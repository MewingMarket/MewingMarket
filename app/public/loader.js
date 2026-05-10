// =========================================================
// CRITICAL LOADER — PUBLIC
// Percorso reale: /app/public/loader.js
// Versione 2050 MINIMAL (SAFE + ULTRA FAST)
// Carica SOLO head.html / header.html / footer.html / header.js
// Emette SEMPRE critical-core-ready
// =========================================================

if (window.__CRITICAL_LOADER_PUBLIC_2050__) {
  console.warn("loader.js (critical public) già caricato, skip.");
} else {
  window.__CRITICAL_LOADER_PUBLIC_2050__ = true;

  (function () {

    const VERSION = "2050";

    console.log("⚡ [CRITICAL PUBLIC 2050] Avvio critical loader PUBLIC (MINIMAL MODE)");

    /* ============================================================
       PRELOAD MINIMALE
    ============================================================ */
    [
      "/head.html",
      "/header.html",
      "/footer.html",
      "/header.js"
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
        console.log("➡️ [CRITICAL LOAD-REQUEST]", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;              // ← PATCH FONDAMENTALE
        s.fetchPriority = "high";

        s.onload = () => {
          console.log("✅ [CRITICAL LOAD-OK]", src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [CRITICAL LOAD-FAIL]", src);
          resolve(false);
        };

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
            console.log(`[CRITICAL PUBLIC] ${label} OK da ${url} (tentativo ${attempt})`);
            return true;

          } catch (e) {
            console.warn(
              `[CRITICAL PUBLIC] ${label} FAIL da ${url} (tentativo ${attempt})`,
              e.message
            );
          }
        }
        await wait(200 * attempt);
      }
      console.error(`[CRITICAL PUBLIC] ${label} FALLITO dopo ${maxAttempts} tentativi`);
      return false;
    }

    /* ============================================================
       /api/ping — ANTI 502
    ============================================================ */
    async function waitUntilServerReady() {
      for (let i = 0; i < 10; i++) {
        try {
          const r = await fetch("/api/ping", { cache: "no-store" });
          if (r.ok) {
            console.log("[CRITICAL PUBLIC] /api/ping OK");
            return true;
          }
        } catch {}
        await wait(120);
      }
      console.warn("[CRITICAL PUBLIC] /api/ping non risponde — fallback");
      return false;
    }

    /* ============================================================
       SEQUENZA CRITICA — MINIMAL MODE
    ============================================================ */
    (async () => {
      let ok = true;

      await waitUntilServerReady();

      // 1) HEAD
      ok &= await fetchHTMLWithRetry(
        [`/head.html?v=${VERSION}`, `head.html?v=${VERSION}`],
        null,
        "head-loaded",
        "head.html"
      );

      // 2) HEADER
      ok &= await fetchHTMLWithRetry(
        [`/header.html?v=${VERSION}`, `header.html?v=${VERSION}`],
        "header-placeholder",
        "header-loaded",
        "header.html"
      );

      // 3) FOOTER
      ok &= await fetchHTMLWithRetry(
        [`/footer.html?v=${VERSION}`, `footer.html?v=${VERSION}`],
        "footer-placeholder",
        "footer-loaded",
        "footer.html"
      );

      // 4) HEADER.JS
      ok &= await loadScriptSerial("/header.js", "body");

      // IMPORT DEBUG HEADER.JS
      try {
        await import("/header.js?v=" + VERSION);
        console.log("📦 [IMPORT-OK] /header.js");
      } catch (e) {
        console.warn("📦❌ [IMPORT-FAIL] /header.js", e.message);
      }

      /* ============================================================
         CRITICAL-CORE-READY SEMPRE EMESSO
      ============================================================ */
      console.log(
        ok
          ? "🟩 [CRITICAL PUBLIC] critical-core-ready (FULL OK)"
          : "🟧 [CRITICAL PUBLIC] critical-core-ready (DEGRADED)"
      );

      window.__criticalCoreReady = true;
      document.dispatchEvent(new Event("critical-core-ready"));
    })();

    /* ============================================================
       FALLBACK DI SICUREZZA — SE QUALCOSA BLOCCA IL CRITICAL
    ============================================================ */
    setTimeout(() => {
      if (!window.__criticalCoreReady) {
        console.warn("🟧 [CRITICAL PUBLIC] Fallback: critical-core-ready non emesso, forzo avvio");
        window.__criticalCoreReady = true;
        document.dispatchEvent(new Event("critical-core-ready"));
      }
    }, 2000);

  })();
}
