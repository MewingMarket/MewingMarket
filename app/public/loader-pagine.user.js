// =========================================================
// LOADER PAGINE USER — Versione 2028.A + DEBUG
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟩 [USER-DEBUG] ${msg}`, data || "");
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
    debug("isLogged", window.isLogged);

    if (!window.isLogged) {
      debug("USER loader ignorato", "utente NON loggato");
      return;
    }

    const p = window.location.pathname;
    debug("Pagina rilevata", p);

    const userPages = [
      ["/dashboard.html", "/dashboard.js"],
      ["/profilo.html", "/profilo.js"],
      ["/ordini.html", "/ordini.js"],
      ["/download.html", "/download.js"],
      ["/recensioni.html", "/recensioni.js"],
      ["/rimborso.html", "/rimborso.js"],
      ["/checkout.html", "/checkout.js"],
      ["/elimina-account.html", "/elimina-account.js"]
    ];

    for (const [page, script] of userPages) {
      if (p.endsWith(page)) {
        if (pageIsOpen("main")) await load(script);
        else debug("JS NON caricato", { motivo: "HTML mancante", script });
      }
    }

    debug("USER loader completato");
  }

  document.addEventListener("critical-ready", () => {
    debug("critical-ready ricevuto");
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
