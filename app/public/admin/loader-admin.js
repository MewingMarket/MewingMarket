/* =========================================================
   LOADER ADMIN — Versione 2026.401 (PATCHED + API UNIVERSALE)
   Patch: ordine garantito, no async, no race condition,
   errori visibili, caricamento sequenziale sicuro.
   Patch 2027.200 — ⭐ AUTO-INJECT api.js + SAFETY CHECK
   Patch 2027.300 — ⭐ safeLoadHTML usa fetchCritico se disponibile
========================================================= */

console.log("[ADMIN] Loader admin avviato");

// Versioning centralizzato
const ADMIN_VERSION = "20260412";

/* ---------------------------------------------------------
   ⭐ PATCH 2027.200 — AUTO-INJECT api.js
--------------------------------------------------------- */
(function ensureApiJs() {
  try {
    const exists = [...document.scripts].some(s => s.src.includes("/api.js"));
    if (!exists) {
      const s = document.createElement("script");
      s.src = "/api.js?v=" + ADMIN_VERSION;
      s.onload = () => console.log("🟩 [ADMIN] api.js caricato automaticamente");
      s.onerror = () => console.error("🟥 [ADMIN] ERRORE: impossibile caricare api.js");
      document.head.appendChild(s);
    } else {
      console.log("🟦 [ADMIN] api.js già presente");
    }
  } catch (e) {
    console.error("🟥 [ADMIN] Errore auto-inject api.js:", e);
  }
})();

/* ---------------------------------------------------------
   ⭐ PATCH 2027.200 — SAFETY CHECK apiFetch
--------------------------------------------------------- */
(function ensureApiFetch() {
  const check = () => {
    if (typeof window.apiFetch === "function") {
      console.log("🟩 [ADMIN] apiFetch OK");
      return;
    }
    console.warn("🟧 [ADMIN] apiFetch NON definito → ritento…");
    setTimeout(check, 200);
  };
  check();
})();

/* ---------------------------------------------------------
   0) ANTI-CACHE + ANTI-SW
--------------------------------------------------------- */
(function ensureNoCacheMeta() {
  try {
    const m1 = document.createElement("meta");
    m1.httpEquiv = "Cache-Control";
    m1.content = "no-cache, no-store, must-revalidate";
    document.head.appendChild(m1);

    const m2 = document.createElement("meta");
    m2.httpEquiv = "Pragma";
    m2.content = "no-cache";
    document.head.appendChild(m2);

    const m3 = document.createElement("meta");
    m3.httpEquiv = "Expires";
    m3.content = "0";
    document.head.appendChild(m3);

    console.log("[ADMIN] Meta anti-cache OK");
  } catch (e) {
    console.warn("[ADMIN] Errore meta anti-cache:", e);
  }
})();

(function removeServiceWorkers() {
  try {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }
    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }
    console.log("[ADMIN] SW + cache rimossi");
  } catch (e) {
    console.warn("[ADMIN] Errore rimozione SW/cache:", e);
  }
})();

/* ---------------------------------------------------------
   1) CARICAMENTO SEQUENZIALE SCRIPT UTILITY (NO ASYNC)
--------------------------------------------------------- */
function loadAdminUtilityScript(name) {
  return new Promise(resolve => {
    const id = `admin-util-${name}`;
    if (document.getElementById(id)) return resolve();

    const s = document.createElement("script");
    s.id = id;
    s.src = `/admin/${name}.js?v=${ADMIN_VERSION}`;
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
   2) CARICAMENTO HTML SEQUENZIALE (SAFE + fetchCritico)
--------------------------------------------------------- */
function safeLoadHTML(url, placeholderId, eventName) {
  const doFetch = () => {
    if (typeof window.fetchCritico === "function") {
      console.log("[ADMIN] safeLoadHTML via fetchCritico:", url);
      return window.fetchCritico(
        url.replace(/^https?:\/\/[^/]+/, "").replace(/^\/api(\/v1|\/v2|\/latest)?/, ""),
        {},
        { retries: 2, backoffMs: 300 }
      ).then(r => r.text());
    }

    console.log("[ADMIN] safeLoadHTML via fetch:", url);
    return fetch(url).then(r => r.text());
  };

  return doFetch()
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
   3) FUNZIONE PRINCIPALE
--------------------------------------------------------- */
async function startAdminLoader() {
  console.log("[ADMIN] Avvio loader admin…");

  await loadAdminUtilityScript("seo-admin");
  await loadAdminUtilityScript("structured-data-admin");

  await safeLoadHTML(`/admin/head-admin.html?v=${ADMIN_VERSION}`, "head-admin-placeholder", "admin-head-loaded");
  await safeLoadHTML(`/admin/header-admin.html?v=${ADMIN_VERSION}`, "header-admin-placeholder", "admin-header-loaded");
  await safeLoadHTML(`/admin/footer-admin.html?v=${ADMIN_VERSION}`, "footer-admin-placeholder", "admin-footer-loaded");

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

  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });

  console.log("[ADMIN] Loader admin completato");
}

/* ---------------------------------------------------------
   4) ASSICURA AUTH + AVVIO
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
