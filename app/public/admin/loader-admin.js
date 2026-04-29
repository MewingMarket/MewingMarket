/* =========================================================
   LOADER ADMIN — VERSIONE AUTONOMA (No mm-api.js)
   PERCORSO: /app/public/admin/loader-admin.js
========================================================= */
console.log("[ADMIN] Critical loader avviato (Standalone Mode)");

const ADMIN_VERSION = "20260412";

function loadAdminUtilityScript(name) {
  return new Promise(resolve => {
    const id = `admin-util-${name}`;
    if (document.getElementById(id)) return resolve();
    const s = document.createElement("script");
    s.id = id;
    s.src = `/admin/${name}.js?v=${ADMIN_VERSION}`;
    s.onload = () => resolve();
    s.onerror = () => resolve(); // Non blocca nulla
    document.head.appendChild(s);
  });
}

function safeLoadHTML(url, placeholderId, eventName) {
  return fetch(url)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(html => {
      const ph = document.getElementById(placeholderId);
      if (ph) {
        ph.innerHTML = html;
        document.dispatchEvent(new Event(eventName));
      }
    })
    .catch(() => console.warn(`[ADMIN] Componente ${url} non caricato`));
}

async function startAdminLoader() {

  /* 🔵 PATCH INTROSPECT — carica introspect.js */
  const introspect = new Promise(resolve => {
    const s = document.createElement("script");
    s.src = `/introspect.js?v=${ADMIN_VERSION}`;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });

  /* 🔵 PATCH DIAGNOSTICA — intercetta tutte le fetch */
  const diagnostica = new Promise(resolve => {
    const s = document.createElement("script");
    s.src = `/js/diagnostica-loader.js?v=${ADMIN_VERSION}`;
    s.onload = resolve;
    s.onerror = resolve;
    document.head.appendChild(s);
  });

  // Utility SEO e Structured Data
  const seoP = loadAdminUtilityScript("seo-admin");
  const sdP  = loadAdminUtilityScript("structured-data-admin");

  // Componenti HTML
  const headP = safeLoadHTML(`/admin/head-admin.html?v=${ADMIN_VERSION}`, "head-admin-placeholder", "admin-head-loaded");
  const headerP = safeLoadHTML(`/admin/header-admin.html?v=${ADMIN_VERSION}`, "header-admin-placeholder", "admin-header-loaded");
  const footerP = safeLoadHTML(`/admin/footer-admin.html?v=${ADMIN_VERSION}`, "footer-admin-placeholder", "admin-footer-loaded");

  Promise.all([introspect, diagnostica, seoP, sdP, headP, headerP, footerP]).then(() => {
    window.__criticalReady = true;
    document.dispatchEvent(new Event("critical-ready"));
    console.log("[ADMIN] ✅ critical-ready emesso (Modalità Indipendente)");
  });
}

// Auth Check & Bootstrap
(function () {
  // ⭐ Nessun mm-api, nessun loader esterno
  if (window.isAdmin) {
    startAdminLoader();
    return;
  }

  // Carica auth.js solo se necessario
  const s = document.createElement("script");
  s.src = `/auth.js?v=${ADMIN_VERSION}`;
  s.onload = () => {
    if (window.isAdmin) startAdminLoader();
    else console.warn("🟥 [ADMIN] Accesso negato — isAdmin = false");
  };
  document.head.appendChild(s);
})();
