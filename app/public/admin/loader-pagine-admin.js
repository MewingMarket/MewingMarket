// =========================================================
// LOADER PAGINE ADMIN — Versione 2028.A
// JS caricati solo se l'utente è admin
// =========================================================

(function () {

  const VERSION = "20280412";

  function load(src) {
    return new Promise(r => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = r;
      s.onerror = r;
      document.body.appendChild(s);
    });
  }

  function pageIsOpen(sel) {
    return document.querySelector(sel) !== null;
  }

  async function run() {
    if (!window.isAdmin) return;

    const p = window.location.pathname;

    if (p.endsWith("/admin/dashboard-admin-profilo.html") && pageIsOpen("main"))
      await load("/admin/dashboard-admin.js");

    if (p.endsWith("/admin/dashboard-admin-vendite-ordini.html") && pageIsOpen("main"))
      await load("/admin/dashboard-vendite-ordini.js");

    if (p.endsWith("/admin/admin-prodotti.html") && pageIsOpen("main"))
      await load("/admin/admin-prodotti.js");

    if (p.endsWith("/admin/feedback.html") && pageIsOpen("main"))
      await load("/admin/feedback.js");

    if (p.endsWith("/admin/utenti.html") && pageIsOpen("main"))
      await load("/admin/utenti.js");

    console.log("[PAGE-LOADER] Admin JS loaded");
  }

  document.addEventListener("critical-ready", () => {
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
