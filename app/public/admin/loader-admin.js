/* =========================================================
   LOADER ADMIN — CRITICAL VERSION (2026.401 + API PATCH)
   Garantisce SEMPRE:
   - api.js (da root)
   - head-admin
   - header-admin
   - footer-admin
   - seo-admin
   - structured-data-admin
   - auth.js
   - ordine sequenziale
   - nessuna race condition
========================================================= */

console.log("[ADMIN] Critical loader avviato");

const ADMIN_VERSION = "20260412";

/* ---------------------------------------------------------
   1) CARICAMENTO UTILITY (CRITICAL)
--------------------------------------------------------- */
function loadAdminUtilityScript(name) {
  return new Promise(resolve => {
    const id = `admin-util-${name}`;
    if (document.getElementById(id)) return resolve();

    const s = document.createElement("script");
    s.id = id;

    // ⭐ PATCH: api.js viene da root, tutto il resto da /admin/
    if (name === "api") {
      s.src = `/api.js?v=${ADMIN_VERSION}`;
    } else {
      s.src = `/admin/${name}.js?v=${ADMIN_VERSION}`;
    }

    s.onload = () => {
      console.log(`[ADMIN] ${name}.js caricato`);
      resolve();
    };
    s.onerror = () => {
      console.warn(`[ADMIN] ${name}.js non trovato`);
      resolve();
    };

    document.head.appendChild(s);
  });
}

/* ---------------------------------------------------------
   2) SAFE LOAD HTML (CRITICAL)
--------------------------------------------------------- */
function safeLoadHTML(url, placeholderId, eventName) {
  return fetch(url)
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById(placeholderId);
      if (!ph) {
        console.warn(`[ADMIN] Placeholder mancante: ${placeholderId}`);
        return;
      }
      ph.innerHTML = html;
      document.dispatchEvent(new Event(eventName));
      console.log(`[ADMIN] ${eventName} OK`);
    })
    .catch(err => console.error(`[ADMIN] Errore caricamento ${url}:`, err));
}

/* ---------------------------------------------------------
   3) FUNZIONE PRINCIPALE (CRITICAL)
--------------------------------------------------------- */
async function startAdminLoader() {
  console.log("[ADMIN] Avvio critical loader admin…");

  // ⭐ API.js PRIMA DI TUTTO (da root)
  await loadAdminUtilityScript("api");

  // Utility critiche (da /admin/)
  await loadAdminUtilityScript("seo-admin");
  await loadAdminUtilityScript("structured-data-admin");

  // HTML critici
  await safeLoadHTML(`/admin/head-admin.html?v=${ADMIN_VERSION}`, "head-admin-placeholder", "admin-head-loaded");
  await safeLoadHTML(`/admin/header-admin.html?v=${ADMIN_VERSION}`, "header-admin-placeholder", "admin-header-loaded");
  await safeLoadHTML(`/admin/footer-admin.html?v=${ADMIN_VERSION}`, "footer-admin-placeholder", "admin-footer-loaded");

  // Logout admin
  document.addEventListener("admin-header-loaded", () => {
    const btn = document.getElementById("logout-admin");
    if (btn) {
      btn.addEventListener("click", () => {
        console.log("[ADMIN] Logout admin");
        localStorage.clear();
        window.location.href = "/index.html";
      });
    }
  });

  // Dynamic title
  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });

  console.log("[ADMIN] Critical loader admin completato");
}

/* ---------------------------------------------------------
   4) ASSICURA AUTH (CRITICAL)
--------------------------------------------------------- */
(function ensureAuthAndStart() {
  if (window.isLogged !== undefined || window.isAdmin !== undefined) {
    console.log("[ADMIN] Auth già presente → avvio loader");
    startAdminLoader();
    return;
  }

  console.log("[ADMIN] Auth mancante → carico auth.js");

  const s = document.createElement("script");
  s.src = `/auth.js?v=${ADMIN_VERSION}`;
  s.onload = () => {
    console.log("[ADMIN] auth.js caricato");
  };
  s.onerror = () => console.error("[ADMIN] ERRORE: impossibile caricare auth.js");
  document.head.appendChild(s);

  document.addEventListener("auth-ready", () => {
    console.log("[ADMIN] auth-ready → avvio loader");
    startAdminLoader();
  });
})();
