/* =========================================================
   LOADER ADMIN — Versione 2026.200 (SELF-CONTAINED)
   Carica: auth.js (se manca) → head-admin → header-admin → footer-admin
========================================================= */

console.log("[ADMIN] Loader admin avviato");

// -----------------------------
// 0) FUNZIONE PRINCIPALE ADMIN
// -----------------------------
function startAdminLoader() {
  console.log("[ADMIN] auth-ready → avvio loader admin");

  // 1) HEAD ADMIN
  fetch("/admin/head-admin.html")
    .then(r => r.text())
    .then(html => {
      const temp = document.createElement("div");
      temp.innerHTML = html;
      [...temp.children].forEach(node => document.head.appendChild(node));
      document.dispatchEvent(new Event("admin-head-loaded"));
      console.log("[ADMIN] head-admin caricato");
    });

  // 2) HEADER ADMIN
  fetch("/admin/header-admin.html")
    .then(r => r.text())
    .then(html => {
      const ph = document.getElementById("header-admin-placeholder");
      if (ph) ph.innerHTML = html;
      document.dispatchEvent(new Event("admin-header-loaded"));
      console.log("[ADMIN] header-admin caricato");
    });

  // 3) FOOTER ADMIN
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

  // 4) LOGOUT ADMIN
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

  // 5) TITOLO DINAMICO
  document.addEventListener("admin-head-loaded", () => {
    const metaTitle = document.querySelector('meta[id="dynamic-title"]');
    if (metaTitle) document.title = metaTitle.content.trim();
  });
}

// -----------------------------
// 1) ASSICURA AUTH + AVVIO
// -----------------------------
(function ensureAuthAndStart() {
  // Caso 1: auth.js è già partito (homepage, ecc.)
  if (typeof window.isLogged !== "undefined" || typeof window.isAdmin !== "undefined") {
    console.log("[ADMIN] auth già inizializzato → parto subito");
    startAdminLoader();
    return;
  }

  console.log("[ADMIN] auth non presente → carico /auth.js");

  // Caso 2: carico auth.js qui
  const s = document.createElement("script");
  s.src = "/auth.js";
  s.onload = () => {
    console.log("[ADMIN] auth.js caricato da loader-admin");
  };
  document.head.appendChild(s);

  // Aspetto auth-ready UNA sola volta
  function onAuthReady() {
    document.removeEventListener("auth-ready", onAuthReady);
    startAdminLoader();
  }

  document.addEventListener("auth-ready", onAuthReady);
})();
