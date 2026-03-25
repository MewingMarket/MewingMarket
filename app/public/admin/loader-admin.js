/* =========================================================
   LOADER ADMIN — Versione 2026.100 (CLEAN)
   Carica: head-admin → header-admin → footer-admin
   Parte SEMPRE dopo auth-ready
========================================================= */

console.log("[ADMIN] In attesa di auth-ready…");

// =========================================================
// 0) AVVIO DOPO AUTH-READY
// =========================================================
document.addEventListener("auth-ready", () => {

  console.log("[ADMIN] auth-ready → avvio loader admin");

  // =========================================================
  // 1) CARICA HEAD ADMIN
  // =========================================================
  fetch("/admin/head-admin.html")
    .then(r => r.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      [...temp.children].forEach(node => document.head.appendChild(node));
      document.dispatchEvent(new Event("admin-head-loaded"));
      console.log("[ADMIN] head-admin caricato");
    });

  // =========================================================
  // 2) CARICA HEADER ADMIN
  // =========================================================
  fetch("/admin/header-admin.html")
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById("header-admin-placeholder");
      if (ph) ph.innerHTML = html;
      document.dispatchEvent(new Event("admin-header-loaded"));
      console.log("[ADMIN] header-admin caricato");
    });

  // =========================================================
  // 3) CARICA FOOTER ADMIN
  // =========================================================
  fetch("/admin/footer-admin.html")
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById("footer-admin-placeholder");
      if (ph) ph.innerHTML = html;

      const year = document.getElementById("anno-admin");
      if (year) year.textContent = new Date().getFullYear();

      document.dispatchEvent(new Event("admin-footer-loaded"));
      console.log("[ADMIN] footer-admin caricato");
    });

  // =========================================================
  // 4) LOGOUT ADMIN
  // =========================================================
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

  // =========================================================
  // 5) TITOLO DINAMICO
  // =========================================================
  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });

});
