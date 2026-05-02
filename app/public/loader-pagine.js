// =========================================================
// LOADER PAGINE — Versione 2028.A
// Carica i JS specifici della pagina in modo seriale
// =========================================================

(function () {

  const VERSION = "20280412";

  function loadScript(src) {
    return new Promise(resolve => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = resolve;
      s.onerror = resolve;
      document.body.appendChild(s);
    });
  }

  async function loadPageScripts() {
    const path = window.location.pathname;

    // PUBLIC
    if (path.endsWith("/top-recensioni.html")) await loadScript("/top-recensioni.js");
    if (path.endsWith("/reset-email-confirm.html")) await loadScript("/reset-email-confirm.js");
    if (path.endsWith("/cancel.html")) await loadScript("/cancel.js");
    if (path.endsWith("/rimborso.html")) await loadScript("/rimborso.js");
    if (path.endsWith("/thankyou.html")) await loadScript("/thankyou.js");
    if (path.endsWith("/registrazione.html")) await loadScript("/registrazione.js");
    if (path.endsWith("/index.html") || path === "/") await loadScript("/index.js");
    if (path.endsWith("/catalogo.html")) await loadScript("/catalogo.js");
    if (path.endsWith("/profilo.html")) await loadScript("/profilo.js");
    if (path.endsWith("/reset-email.html")) await loadScript("/reset-email-request.js");
    if (path.endsWith("/regolamento.html")) await loadScript("/regole.js");
    if (path.endsWith("/elimina-account.html")) await loadScript("/elimina-account.js");
    if (path.endsWith("/disiscriviti.html")) await loadScript("/disiscrizione.js");
    if (path.endsWith("/download.html")) await loadScript("/download.js");
    if (path.endsWith("/checkout.html")) await loadScript("/checkout.js");
    if (path.endsWith("/login.html")) await loadScript("/login.js");
    if (path.endsWith("/guide.html")) await loadScript("/guide.js");
    if (path.endsWith("/recensioni.html")) await loadScript("/recensioni.js");
    if (path.endsWith("/dashboard.html")) await loadScript("/dashboard.js");
    if (path.endsWith("/assistenza.html")) {
      await loadScript("/assistenza.js");
      await loadScript("/chat.js");
      await loadScript("/premium.js");
    }
    if (path.endsWith("/iscrizione.html")) await loadScript("/iscrizione.js");
    if (path.endsWith("/reset-password.html")) await loadScript("/reset-password-request.js");
    if (path.endsWith("/ordini.html")) await loadScript("/ordini.js");
    if (path.endsWith("/prodotto.html")) await loadScript("/prodotto.js");
    if (path.endsWith("/reset-password-confirm.html")) await loadScript("/reset-password-confirm.js");
    if (path.endsWith("/FAQ.html")) await loadScript("/FAQ.js");

    // ADMIN
    if (path.endsWith("/admin/dashboard-admin-profilo.html")) await loadScript("/admin/dashboard-admin.js");
    if (path.endsWith("/admin/dashboard-admin-vendite-ordini.html")) await loadScript("/admin/dashboard-vendite-ordini.js");
    if (path.endsWith("/admin/admin-prodotti.html")) await loadScript("/admin/admin-prodotti.js");
    if (path.endsWith("/admin/feedback.html")) await loadScript("/admin/feedback.js");
    if (path.endsWith("/admin/utenti.html")) await loadScript("/admin/utenti.js");

    console.log("[PAGE-LOADER] JS pagina caricati");
  }

  document.addEventListener("critical-ready", () => {
    loadPageScripts();
  });

})();
