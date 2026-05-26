// =========================================================
// CRITICAL LOADER — PUBLIC 2057.4 (JAVA-MODE SAFE)
// PATCH 2058 — RIMOSSO critical-ready
// Percorso: /app/public/loader.js
// =========================================================

if (window.__CRITICAL_LOADER_PUBLIC_2057__) {
  console.warn("[CRITICAL PUBLIC 2057] Già caricato → skip");
} else {
  window.__CRITICAL_LOADER_PUBLIC_2057__ = true;

  (function () {

    const VERSION = "2057";

    console.log("⚡ [CRITICAL PUBLIC 2057] Avvio critical loader PUBLIC (JAVA-MODE)");

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

    function loadScript(src, where = "head") {
      return new Promise(resolve => {
        console.log("➡️ [CRITICAL PUBLIC] LOAD-REQUEST", src);

        if (window.__SCRIPT_LOCK__ && window.__SCRIPT_LOCK__[src]) {
          console.warn("[SCRIPT-LOCK] Script già caricato:", src);
          return resolve(true);
        }

        window.__SCRIPT_LOCK__ = window.__SCRIPT_LOCK__ || {};
        window.__SCRIPT_LOCK__[src] = true;

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

    (async () => {

      await loadHTML(`/head.html?v=${VERSION}`, null, "head.html");
      await loadHTML(`/header.html?v=${VERSION}`, "header-placeholder", "header.html");
      await loadHTML(`/footer.html?v=${VERSION}`, "footer-placeholder", "footer.html");

      await new Promise(r => setTimeout(r, 20));

      await loadScript("/header.js", "body");

      console.log("🟩 [CRITICAL PUBLIC 2057] HTML base caricato (JAVA-MODE)");

      // ❌ RIMOSSO critical-ready
      // Il SUPREMO PUBLIC sarà l’unico a emetterlo

    })();

  })();
}
