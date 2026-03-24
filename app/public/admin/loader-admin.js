/* =========================================================
   LOADER ADMIN — Versione 2026.90 + PATCH DEPLOY
   Carica: head-admin → header-admin → footer-admin
   Nessun controllo admin (gestito da auth.js + loader globale)
========================================================= */

console.log("[ADMIN] Loader admin avviato");

// =========================================================
// PATCH — Se arriva logout automatico → blocca tutto
// =========================================================
let adminAbort = false;

document.addEventListener("auto-logout", () => {
  console.log("[ADMIN] Logout automatico → blocco loader admin");
  adminAbort = true;

  // Svuota header e footer admin
  const h = document.getElementById("header-admin-placeholder");
  const f = document.getElementById("footer-admin-placeholder");
  if (h) h.innerHTML = "";
  if (f) f.innerHTML = "";
});

// =========================================================
// 1) CARICA HEAD ADMIN
// =========================================================
const headPromise = fetch("/admin/head-admin.html")
  .then(r => r.text())
  .then(html => {
    if (adminAbort) return;

    const temp = document.createElement("div");
    temp.innerHTML = html;

    [...temp.children].forEach(node => document.head.appendChild(node));

    document.dispatchEvent(new Event("admin-head-loaded"));
    console.log("[ADMIN] head-admin caricato");
  });

// =========================================================
// 2) CARICA HEADER ADMIN
// =========================================================
const headerPromise = headPromise.then(() => {
  if (adminAbort) return;

  return fetch("/admin/header-admin.html")
    .then(r => r.text())
    .then(html => {
      if (adminAbort) return;

      const placeholder = document.getElementById("header-admin-placeholder");
      if (placeholder) placeholder.innerHTML = html;

      document.dispatchEvent(new Event("admin-header-loaded"));
      console.log("[ADMIN] header-admin caricato");
    });
});

// =========================================================
// 3) CARICA FOOTER ADMIN
// =========================================================
const footerPromise = headerPromise.then(() => {
  if (adminAbort) return;

  return fetch("/admin/footer-admin.html")
    .then(r => r.text())
    .then(html => {
      if (adminAbort) return;

      const placeholder = document.getElementById("footer-admin-placeholder");
      if (placeholder) placeholder.innerHTML = html;

      const year = document.getElementById("anno-admin");
      if (year) year.textContent = new Date().getFullYear();

      document.dispatchEvent(new Event("admin-footer-loaded"));
      console.log("[ADMIN] footer-admin caricato");
    });
});

// =========================================================
// 4) LOGOUT ADMIN — PATCHATO
// =========================================================
footerPromise.then(() => {
  if (adminAbort) return;

  const btn = document.getElementById("logout-admin");
  if (btn) {
    btn.addEventListener("click", () => {
      console.log("[ADMIN] Logout admin");

      // PATCH → logout manuale
      localStorage.setItem("logoutReason", "manual");

      localStorage.clear();
      window.location.href = "/index.html";
    });
  }
});

// =========================================================
// 5) TITOLO DINAMICO
// =========================================================
document.addEventListener("admin-head-loaded", () => {
  if (adminAbort) return;

  const metaTitle = document.querySelector('meta[id="dynamic-title"]');
  if (metaTitle) document.title = metaTitle.content.trim();
});
