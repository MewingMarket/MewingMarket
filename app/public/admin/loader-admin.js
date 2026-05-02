// =========================================================
// ADMIN LOADER — Versione 2028.A (SAFE MODE, PAGINE)
// Anti 499/502 — Nessun introspect, nessuna diagnostica
// Caricamento seriale, attesa server-ready + loader-pagine
// =========================================================

console.log("[ADMIN] Loader 2028.A avviato (SAFE MODE)");

const ADMIN_VERSION = "20280412";

/* =========================================================
   UTILITY BASE
========================================================= */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function loadScriptSerial(src, where = "head") {
  return new Promise(resolve => {
    const s = document.createElement("script");
    s.src = `${src}?v=${ADMIN_VERSION}`;
    s.defer = true;
    s.onload = resolve;
    s.onerror = resolve;
    (where === "body" ? document.body : document.head).appendChild(s);
  });
}

function fetchHTMLSerial(url, placeholderId, eventName) {
  return fetch(url)
    .then(r => r.ok ? r.text() : Promise.reject())
    .then(html => {
      const ph = document.getElementById(placeholderId);
      if (ph) ph.innerHTML = html;
      if (eventName) document.dispatchEvent(new Event(eventName));
    })
    .catch(() => console.warn(`[ADMIN] ${url} non caricato`));
}

/* =========================================================
   /api/ping — ANTI‑502
========================================================= */
function pingOnce() {
  return fetch("/api/ping")
    .then(r => r.ok ? r.json() : Promise.reject())
    .then(() => true)
    .catch(() => false);
}

async function waitUntilServerReady() {
  for (let i = 0; i < 10; i++) {
    const ok = await pingOnce();
    if (ok) return;
    await wait(150);
  }
  console.warn("[ADMIN] /api/ping non risponde — SAFE FALLBACK");
}

/* =========================================================
   LOADER PRINCIPALE (SERIALE)
========================================================= */
async function startAdminLoader() {

  console.log("[ADMIN] Avvio sequenza seriale 2028.A");

  // 1) Aspetta che il server sia vivo
  await waitUntilServerReady();

  // 2) SEO + Structured Data (seriale)
  await loadScriptSerial(`/admin/seo-admin.js`);
  await loadScriptSerial(`/admin/structured-data-admin.js`);

  // 3) HEAD ADMIN
  await fetchHTMLSerial(`/admin/head-admin.html?v=${ADMIN_VERSION}`,
                        "head-admin-placeholder",
                        "admin-head-loaded");

  // 4) HEADER ADMIN
  await fetchHTMLSerial(`/admin/header-admin.html?v=${ADMIN_VERSION}`,
                        "header-admin-placeholder",
                        "admin-header-loaded");

  // 5) FOOTER ADMIN
  await fetchHTMLSerial(`/admin/footer-admin.html?v=${ADMIN_VERSION}`,
                        "footer-admin-placeholder",
                        "admin-footer-loaded");

  // 6) LOADER PAGINE (JS specifici admin/public)
  await loadScriptSerial(`/loader-pagine.js`, "body");

  // 7) SAFE READY
  window.__criticalReady = true;
  document.dispatchEvent(new Event("critical-ready"));
  console.log("[ADMIN] critical-ready (2028.A SAFE + PAGINE)");
}

/* =========================================================
   AUTH CHECK & BOOTSTRAP (SAFE)
========================================================= */
(function () {

  // Se già admin → parti subito
  if (window.isAdmin) {
    startAdminLoader();
    return;
  }

  // Carica auth.js solo se necessario
  const s = document.createElement("script");
  s.src = `/auth.js?v=${ADMIN_VERSION}`;
  s.defer = true;
  s.onload = () => {
    if (window.isAdmin) startAdminLoader();
    else console.warn("🟥 [ADMIN] Accesso negato — isAdmin = false");
  };
  document.head.appendChild(s);

})();
