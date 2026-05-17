// =========================================================
// CRITICAL LOADER — PUBLIC 2056 (JAVA-MODE SAFE)
// Percorso reale: /app/public/loader.js
// Carica head.html / header.html / footer.html / header.js
// Emissione evento: critical-core-loaded (NON critical-ready)
// =========================================================

if (window.__CRITICAL_LOADER_PUBLIC_2056__) {
  console.warn("[CRITICAL PUBLIC 2056] Già caricato → skip");
} else {
  window.__CRITICAL_LOADER_PUBLIC_2056__ = true;

  (function () {

    const VERSION = "2056";

    console.log("⚡ [CRITICAL PUBLIC 2056] Avvio critical loader PUBLIC (JAVA-MODE)");

    // ============================================================
    // Utility: carica HTML in modo deterministico
    // ============================================================
    function loadHTML(url, placeholderId, label) {
      return new Promise(resolve => {
        fetch(url, { cache: "no-store" })
          .then(r => {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return r.text();
          })
          .then(html => {
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

            console.log(`✅ [CRITICAL PUBLIC] ${label} OK da ${url}`);
            resolve(true);
          })
          .catch(e => {
            console.warn(`❌ [CRITICAL PUBLIC] ${label} FAIL da ${url}`, e.message);
            resolve(false);
          });
      });
    }

    // ============================================================
    // Utility: carica script JS in modo deterministico
    // ============================================================
    function loadScript(src, where = "head") {
      return new Promise(resolve => {
        console.log("➡️ [CRITICAL PUBLIC] LOAD-REQUEST", src);

        const s = document.createElement("script");
        s.src = `${src}?v=${VERSION}`;
        s.async = false;

        s.onload = () => {
          console.log("✅ [CRITICAL PUBLIC] LOAD-OK", src);
          resolve(true);
        };

        s.onerror = () => {
          console.warn("❌ [CRITICAL PUBLIC] LOAD-FAIL", src);
          resolve(false);
        };

        (where === "body" ? document.body : document.head).appendChild(s);
      });
    }

    // ============================================================
    // SEQUENZA CRITICA — HTML + header.js
    // ============================================================
    (async () => {

      // 1) HEAD
      await loadHTML(`/head.html?v=${VERSION}`, null, "head.html");

      // 2) HEADER
      await loadHTML(`/header.html?v=${VERSION}`, "header-placeholder", "header.html");

      // 3) FOOTER
      await loadHTML(`/footer.html?v=${VERSION}`, "footer-placeholder", "footer.html");

      // 4) MICRO-DELAY per evitare race con SUPREMO
      await new Promise(r => setTimeout(r, 20));

      // 5) HEADER.JS (sempre dopo header.html)
      await loadScript("/header.js", "body");

      console.log("🟩 [CRITICAL PUBLIC 2056] HTML base caricato (JAVA-MODE)");

      // 6) EMISSIONE EVENTO PER SUPREMO
      window.__criticalCoreLoaded = true;
      document.dispatchEvent(new Event("critical-core-loaded"));

    })();

  })();
}
