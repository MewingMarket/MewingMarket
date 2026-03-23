/* =========================================================
   LOADER ADMIN — Versione 2026.80 (FINALE)
   Carica: head-admin → verifica admin → header-admin → footer-admin
   Auth.js viene caricato dal LOADER GLOBALE (non qui)
========================================================= */

console.log("[ADMIN] Loader admin avviato");

/* ---------------------------------------------------------
   1) CARICA HEAD ADMIN (CSS + FontAwesome)
--------------------------------------------------------- */
const headPromise = fetch("/admin/head-admin.html")
  .then(r => r.text())
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    [...temp.children].forEach(node => document.head.appendChild(node));

    document.dispatchEvent(new Event("admin-head-loaded"));
    console.log("[ADMIN] head-admin caricato");
  });

/* ---------------------------------------------------------
   2) CONTROLLO ACCESSO ADMIN
   (auth.js — caricato dal loader globale — deve settare window.isAdmin)
--------------------------------------------------------- */
const authCheckPromise = headPromise.then(() => {
  return new Promise((resolve) => {
    document.addEventListener("auth-ready", () => {
      if (!window.isAdmin) {
        console.warn("[ADMIN] Accesso negato → non sei admin");
        window.location.href = "/index.html";
      } else {
        console.log("[ADMIN] Accesso admin confermato");
        document.dispatchEvent(new Event("admin-auth-ok"));
        resolve();
      }
    });
  });
});

/* ---------------------------------------------------------
   3) CARICA HEADER ADMIN
--------------------------------------------------------- */
const headerPromise = authCheckPromise.then(() => {
  return fetch("/admin/header-admin.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("header-admin-placeholder");
      if (placeholder) placeholder.innerHTML = html;

      document.dispatchEvent(new Event("admin-header-loaded"));
      console.log("[ADMIN] header-admin caricato");
    });
});

/* ---------------------------------------------------------
   4) CARICA FOOTER ADMIN
--------------------------------------------------------- */
const footerPromise = headerPromise.then(() => {
  return fetch("/admin/footer-admin.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("footer-admin-placeholder");
      if (placeholder) placeholder.innerHTML = html;

      const year = document.getElementById("anno-admin");
      if (year) year.textContent = new Date().getFullYear();

      document.dispatchEvent(new Event("admin-footer-loaded"));
      console.log("[ADMIN] footer-admin caricato");
    });
});

/* ---------------------------------------------------------
   5) LOGOUT ADMIN
--------------------------------------------------------- */
footerPromise.then(() => {
  const btn = document.getElementById("logout-admin");
  if (btn) {
    btn.addEventListener("click", () => {
      console.log("[ADMIN] Logout admin");
      localStorage.clear();
      window.location.href = "/index.html";
    });
  }
});

/* ---------------------------------------------------------
   6) TITOLO DINAMICO
--------------------------------------------------------- */
document.addEventListener("admin-head-loaded", () => {
  const metaTitle = document.querySelector('meta[id="dynamic-title"]');
  if (metaTitle) document.title = metaTitle.content.trim();
});
