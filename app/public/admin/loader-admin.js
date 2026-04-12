/* =========================================================
   LOADER ADMIN — Versione 2026.400 (CLEAN + ANTI-SW)
   Carica: auth.js (se manca) → head-admin → header-admin → footer-admin
   + SEO / Structured Data admin (safe)
   + Versioning / Anti-cache / Anti-ServiceWorker
========================================================= */

console.log("[ADMIN] Loader admin avviato");

// Versioning centralizzato
const ADMIN_VERSION = "20260412";

// -------------------------------------------------
// 0) MINI ANTI-CACHE CLIENT
// -------------------------------------------------
(function ensureNoCacheMeta() {
  try {
    const hasCacheMeta = !!document.querySelector('meta[http-equiv="Cache-Control"]');
    if (!hasCacheMeta) {
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

      console.log("[ADMIN] Meta anti-cache aggiunti");
    }
  } catch (e) {
    console.warn("[ADMIN] Impossibile aggiungere meta anti-cache:", e);
  }
})();

// -------------------------------------------------
// 0.1) ANTI SERVICE WORKER + CLEAR CACHE (SAFE)
// -------------------------------------------------
(function removeServiceWorkers() {
  try {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        regs.forEach(r => r.unregister());
      });
    }

    if (window.caches) {
      caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
    }

    console.log("[ADMIN] Service worker e cache rimossi");
  } catch (e) {
    console.warn("[ADMIN] Errore rimozione SW/cache:", e);
  }
})();

// -------------------------------------------------
// 0.2) CARICATORI SAFE PER SEO / STRUCTURED DATA
// -------------------------------------------------
function loadAdminUtilityScript(name) {
  try {
    const id = `admin-util-${name}`;
    if (document.getElementById(id)) return;

    const s = document.createElement("script");
    s.id = id;
    s.src = `/admin/${name}.js?v=${ADMIN_VERSION}`;
    s.async = true;
    s.onload = () => console.log(`[ADMIN] ${name}.js caricato`);
    s.onerror = () => console.warn(`[ADMIN] ${name}.js non trovato`);
    document.head.appendChild(s);
  } catch (e) {
    console.warn(`[ADMIN] Errore caricamento ${name}.js:`, e);
  }
}

loadAdminUtilityScript("seo-admin");
loadAdminUtilityScript("structured-data-admin");

// -----------------------------
// 1) FUNZIONE PRINCIPALE ADMIN
// -----------------------------
function startAdminLoader() {
  console.log("[ADMIN] auth-ready → avvio loader admin");

  // HEAD ADMIN
  fetch(`/admin/head-admin.html?v=${ADMIN_VERSION}`)
    .then(r => r.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      [...temp.children].forEach(node => document.head.appendChild(node));
      document.dispatchEvent(new Event("admin-head-loaded"));
      console.log("[ADMIN] head-admin caricato");
    });

  // HEADER ADMIN
  fetch(`/admin/header-admin.html?v=${ADMIN_VERSION}`)
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById("header-admin-placeholder");
      if (ph) ph.innerHTML = html;
      document.dispatchEvent(new Event("admin-header-loaded"));
      console.log("[ADMIN] header-admin caricato");
    });

  // FOOTER ADMIN
  fetch(`/admin/footer-admin.html?v=${ADMIN_VERSION}`)
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById("footer-admin-placeholder");
      if (ph) ph.innerHTML = html;

      const year = document.getElementById("anno-admin");
      if (year) year.textContent = new Date().getFullYear();

      document.dispatchEvent(new Event("admin-footer-loaded"));
      console.log("[ADMIN] footer-admin caricato");
    });

  // LOGOUT ADMIN
  document.addEventListener("admin-header-loaded", () => {
    const btn = document.getElementById("logout-admin");
    if (btn) {
      btn.addEventListener("click", () => {
        console.log("[ADMIN] Logout admin");
        localStorage.setItem("logoutReason", "manual");
        localStorage.clear();
        window.location.href = "/index.html";
      });
    }
  });

  // TITOLO DINAMICO
  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });
}

// -----------------------------
// 2) ASSICURA AUTH + AVVIO
// -----------------------------
(function ensureAuthAndStart() {
  if (typeof window.isLogged !== "undefined" || typeof window.isAdmin !== "undefined") {
    console.log("[ADMIN] auth già inizializzato → parto subito");
    startAdminLoader();
    return;
  }

  console.log("[ADMIN] auth non presente → carico /auth.js");

  const s = document.createElement("script");
  s.src = `/auth.js?v=${ADMIN_VERSION}`;
  s.onload = () => console.log("[ADMIN] auth.js caricato da loader-admin");
  s.onerror = () => console.error("[ADMIN] ERRORE: impossibile caricare auth.js");
  document.head.appendChild(s);

  function onAuthReady() {
    document.removeEventListener("auth-ready", onAuthReady);
    startAdminLoader();
  }

  document.addEventListener("auth-ready", onAuthReady);
})();
