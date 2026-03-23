/* =========================================================
   LOADER ADMIN — Head + Header + Footer + Accesso Admin
   Versione 2026.60 — Struttura Admin Unificata
========================================================= */

console.log("[ADMIN] Loader admin avviato");

/* ---------------------------------------------------------
   1) CARICA HEAD ADMIN (CSS + FontAwesome)
--------------------------------------------------------- */
fetch("head-admin.html")
  .then(r => r.text())
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    // Inserisce ogni nodo nel <head>
    [...temp.children].forEach(node => document.head.appendChild(node));

    document.dispatchEvent(new Event("admin-head-loaded"));
  });

/* ---------------------------------------------------------
   2) CONTROLLO ACCESSO ADMIN
   (auth.js deve settare window.isAdmin = true)
--------------------------------------------------------- */
document.addEventListener("auth-ready", () => {
  if (!window.isAdmin) {
    console.warn("[ADMIN] Accesso negato → non sei admin");
    window.location.href = "../index.html";
  } else {
    document.dispatchEvent(new Event("admin-auth-ok"));
  }
});

/* ---------------------------------------------------------
   3) CARICA HEADER ADMIN
--------------------------------------------------------- */
document.addEventListener("admin-auth-ok", () => {
  fetch("header-admin.html")
    .then(r => r.text())
    .then(html => {
      const placeholder = document.getElementById("header-admin-placeholder");
      if (placeholder) {
        placeholder.innerHTML = html;
      }
      document.dispatchEvent(new Event("admin-header-loaded"));
    });
});

/* ---------------------------------------------------------
   4) CARICA FOOTER ADMIN
--------------------------------------------------------- */
fetch("footer-admin.html")
  .then(r => r.text())
  .then(html => {
    const placeholder = document.getElementById("footer-admin-placeholder");
    if (placeholder) {
      placeholder.innerHTML = html;
    }

    // Aggiorna anno dinamico se presente
    const year = document.getElementById("anno-admin");
    if (year) year.textContent = new Date().getFullYear();

    document.dispatchEvent(new Event("admin-footer-loaded"));
  });

/* ---------------------------------------------------------
   5) LOGOUT ADMIN
--------------------------------------------------------- */
document.addEventListener("admin-header-loaded", () => {
  const btn = document.getElementById("logout-admin");
  if (btn) {
    btn.addEventListener("click", () => {
      console.log("[ADMIN] Logout admin");
      localStorage.clear();
      window.location.href = "../index.html";
    });
  }
});

/* ---------------------------------------------------------
   6) TITOLO DINAMICO (opzionale)
--------------------------------------------------------- */
document.addEventListener("admin-head-loaded", () => {
  const metaTitle = document.querySelector('meta[id="dynamic-title"]');
  if (metaTitle) {
    document.title = metaTitle.content.trim();
  }
});
