// =========================================================
// LOADER PAGINE USER — Versione 2028.A
// JS caricati solo se l'utente è loggato
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

  async function run() {
    if (!window.isLogged) return;

    const p = window.location.pathname;

    if (p.endsWith("/dashboard.html")) await load("/dashboard.js");
    if (p.endsWith("/profilo.html")) await load("/profilo.js");
    if (p.endsWith("/ordini.html")) await load("/ordini.js");
    if (p.endsWith("/download.html")) await load("/download.js");
    if (p.endsWith("/recensioni.html")) await load("/recensioni.js");
    if (p.endsWith("/rimborso.html")) await load("/rimborso.js");
    if (p.endsWith("/checkout.html")) await load("/checkout.js");
    if (p.endsWith("/elimina-account.html")) await load("/elimina-account.js");

    console.log("[PAGE-LOADER] User JS loaded");
  }

  document.addEventListener("critical-ready", () => {
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
