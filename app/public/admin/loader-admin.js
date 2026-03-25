/* =========================================================
   LOADER ADMIN — Versione 2026.90 + PATCH DEPLOY + FIX RACE
   Carica: head-admin → header-admin → footer-admin
   Controllo admin sincronizzato con auth-ready
========================================================= */

console.log("[ADMIN] Loader admin in attesa di auth-ready…");

// =========================================================
// 0) AVVIO DOPO AUTH-READY (fix race condition)
// =========================================================
document.addEventListener("auth-ready", () => {

  console.log("[ADMIN] auth-ready ricevuto → avvio loader admin");

  // =========================================================
  // 1) CONTROLLO ADMIN DOPO auth.js (stato reale)
  // =========================================================
  let adminAbort = false;

  if (!window.isAdmin) {
    console.log("[ADMIN] Blocco immediato: utente NON admin (stato reale)");
    adminAbort = true;
  }

  // =========================================================
  // 2) PATCH — Se arriva logout automatico → blocca tutto
  // =========================================================
  document.addEventListener("auto-logout", () => {
    console.log("[ADMIN] Logout automatico → blocco loader admin");
    adminAbort = true;

    const h = document.getElementById("header-admin-placeholder");
    const f = document.getElementById("footer-admin-placeholder");
    if (h) h.innerHTML = "";
    if (f) f.innerHTML = "";
  });

  // =========================================================
  // 3) CARICA HEAD ADMIN
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
  // 4) CARICA HEADER ADMIN
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
  // 5) CARICA FOOTER ADMIN
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
  // 6) LOGOUT ADMIN — PATCHATO
  // =========================================================
  footerPromise.then(() => {
    if (adminAbort) return;

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

  // =========================================================
  // 7) TITOLO DINAMICO
  // =========================================================
  document.addEventListener("admin-head-loaded", () => {
    if (adminAbort) return;

    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });

});
