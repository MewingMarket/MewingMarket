// =========================================================
// LOADER PAGINE ADMIN — Versione 2028.A + DEBUG
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟥 [ADMIN-DEBUG] ${msg}`, data || "");
  }

  function load(src) {
    debug("Caricamento script richiesto", src);
    return new Promise(r => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = () => { debug("Script caricato", src); r(); };
      s.onerror = () => { debug("ERRORE script", src); r(); };
      document.body.appendChild(s);
    });
  }

  function pageIsOpen(sel) {
    const exists = document.querySelector(sel) !== null;
    debug(`Controllo HTML selector="${sel}" → ${exists}`);
    return exists;
  }

  async function run() {
    debug("isAdmin", window.isAdmin);

    if (!window.isAdmin) {
      debug("ADMIN loader ignorato", "utente NON admin");
      return;
    }

    const p = window.location.pathname;
    debug("Pagina rilevata", p);

    const adminPages = [
      ["/admin/dashboard-admin-profilo.html", "/admin/dashboard-admin.js"],
      ["/admin/dashboard-admin-vendite-ordini.html", "/admin/dashboard-vendite-ordini.js"],
      ["/admin/admin-prodotti.html", "/admin/admin-prodotti.js"],
      ["/admin/feedback.html", "/admin/feedback.js"],
      ["/admin/utenti.html", "/admin/utenti.js"]
    ];

    for (const [page, script] of adminPages) {
      if (p.endsWith(page)) {
        if (pageIsOpen("main")) await load(script);
        else debug("JS NON caricato", { motivo: "HTML mancante", script });
      }
    }

    debug("ADMIN loader completato");
  }

  document.addEventListener("critical-ready", () => {
    debug("critical-ready ricevuto");
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
