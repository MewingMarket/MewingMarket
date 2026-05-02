// =========================================================
// CRITICAL LOADER — MewingMarket
// Versione 2028.A-SAFE — Anti 499/502, SENZA mm-api.js, introspect, diagnostica-loader
// Compatibile universal-json + router universale + loader-pagine
// =========================================================

(function () {

  const VERSION = "20280412";

  console.log("[CRITICAL] Loader 2028.A avviato (SAFE)");

  /* ============================================================
     0) UTILITY BASE
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
     1) TEST SERVER /api/ping — ANTI 502
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
        console.log("[CRITICAL] /api/ping OK, procedo con il loader");
        return;
      }
      await wait(150);
    }
    console.warn("[CRITICAL] /api/ping non risponde, procedo comunque (SAFE FALLBACK)");
  }

  /* ============================================================
     2) AUTH (caricata sempre, no mm-api)
  ============================================================ */
  function loadAuth() {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.id = "critical-auth";
      s.src = `/auth.js?v=${VERSION}`;
      s.defer = true;
      s.onload = () => {
        console.log("[CRITICAL] auth.js caricato");
        resolve();
      };
      s.onerror = () => {
        console.error("[CRITICAL] ERRORE: auth.js non caricato");
        resolve();
      };
      document.head.appendChild(s);
    });
  }

  /* ============================================================
     3) HEAD HTML (seriale, no burst)
  ============================================================ */
  async function safeFetchAppendHeadSerial() {
    const urls = [
      `head.html?v=${VERSION}`,
      `/head.html?v=${VERSION}`
    ];

    for (const url of urls) {
      try {
        const html = await fetchText(url);
        if (!html || (html.trim().startsWith("<!DOCTYPE html") && !html.includes("<head"))) {
          console.warn("[CRITICAL] head.html sembra HTML fallback");
        }

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
      } catch (err) {
        console.error("[CRITICAL] head non caricato da", url, err);
      }
    }

    console.error("[CRITICAL] head.html non caricato da nessun percorso");
    return false;
  }

  /* ============================================================
     4) HEADER HTML (seriale)
  ============================================================ */
  async function safeFetchHeaderSerial() {
    const urls = [
      `header.html?v=${VERSION}`,
      `/header.html?v=${VERSION}`
    ];

    for (const url of urls) {
      try {
        const html = await fetchText(url);
        const ph = document.getElementById("header-placeholder");
        if (ph) ph.innerHTML = html;
        document.dispatchEvent(new Event("header-loaded"));
        console.log("[CRITICAL] header.html caricato");
        return true;
      } catch (err) {
        console.error("[CRITICAL] header non caricato da", url, err);
      }
    }

    console.error("[CRITICAL] header.html non caricato da nessun percorso");
    return false;
  }

  /* ============================================================
     5) FOOTER HTML (seriale)
  ============================================================ */
  async function safeFetchFooterSerial() {
    const urls = [
      `footer.html?v=${VERSION}`,
      `/footer.html?v=${VERSION}`
    ];

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
      } catch (err) {
        console.error("[CRITICAL] footer non caricato da", url, err);
      }
    }

    console.error("[CRITICAL] footer.html non caricato da nessun percorso");
    return false;
  }

  /* ============================================================
     6) INTROSPECT / DIAGNOSTICA (DISATTIVATI)
  ============================================================ */
  const introspectPromise = Promise.resolve().then(() => {
    console.log("🟧 SAFE MODE: introspect.js DISATTIVATO");
  });

  const diagnosticaPromise = Promise.resolve().then(() => {
    console.log("🟧 SAFE MODE: diagnostica-loader.js DISATTIVATO");
  });

  /* ============================================================
     7) SEQUENZA CRITICA ANTI‑499 / ANTI‑502
  ============================================================ */
  (async () => {
    try {
      // 1) Aspetta che il server sia vivo
      await waitUntilServerReady();

      // 2) Utility (SEO, structured, tracking) in sequenza
      await loadScriptSerial("/seo.js");
      console.log("[CRITICAL] seo.js caricato");

      await loadScriptSerial("/structured-data.js");
      console.log("[CRITICAL] structured-data.js caricato");

      await loadScriptSerial("/tracking.js");
      console.log("[CRITICAL] tracking.js caricato");

      // 3) Auth
      await loadAuth();

      // 4) Head → Header → header.js → Footer → Carrello
      await safeFetchAppendHeadSerial();
      await safeFetchHeaderSerial();

      await loadScriptSerial("/header.js", "body");
      console.log("[CRITICAL] header.js caricato");

      await safeFetchFooterSerial();

      await loadScriptSerial("/carrello.js", "body");
      console.log("[CRITICAL] carrello.js caricato");

      // 5) Admin loader (solo se admin, dopo auth)
      await new Promise(resolve => {
        const checkAdmin = () => {
          if (window.isAdmin === true) {
            const s = document.createElement("script");
            s.src = `/admin/loader-admin.js?v=${VERSION}`;
            s.defer = true;
            s.onload = resolve;
            s.onerror = resolve;
            document.body.appendChild(s);
          } else {
            resolve();
          }
        };

        if (window.isAdmin !== undefined) {
          checkAdmin();
        } else {
          document.addEventListener("auth-ready", checkAdmin, { once: true });
          setTimeout(resolve, 2000);
        }
      });

      // 6) LOADER PAGINE (JS specifici per pagina)
      await loadScriptSerial("/loader-pagine.js", "body");

      // 7) SAFE READY
      await introspectPromise;
      await diagnosticaPromise;

      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
      console.log("[CRITICAL] critical-ready emesso (2028.A-SAFE + PAGINE)");

    } catch (err) {
      console.error("[CRITICAL] ERRORE NEL LOADER 2028.A:", err);
      window.__criticalReady = true;
      document.dispatchEvent(new Event("critical-ready"));
    }
  })();

})();
