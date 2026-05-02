// =========================================================
// LOADER PAGINE ADMIN — Versione 2028.B UNIVERSALE (PATCH GET)
// Nessuna lista, nessuna mappatura, nessuna convenzione obbligatoria
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟥 [ADMIN-DEBUG] ${msg}`, data || "");
  }

  function load(src) {
    debug("Caricamento script", src);
    return new Promise(r => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = () => { debug("Script caricato", src); r(); };
      s.onerror = () => { debug("ERRORE script", src); r(); };
      document.body.appendChild(s);
    });
  }

  async function run() {

    if (!window.isAdmin) {
      debug("Ignorato: utente NON admin");
      return;
    }

    const path = window.location.pathname;  
    debug("Pagina rilevata", path);

    // 1) Estrai nome base della pagina
    const base = path.split("/").pop().replace(".html", "");
    debug("Nome base HTML", base);

    // 2) Costruisci possibili JS compatibili
    const candidates = [
      `/admin/${base}.js`,
      `/admin/${base}-admin.js`,
      `/admin/${base}-page.js`,
      `/admin/${base}-controller.js`
    ];

    // 3) Prova a caricare il primo JS che esiste (PATCH: GET invece di HEAD)
    for (const js of candidates) {
      try {
        const res = await fetch(js, { method: "GET", cache: "no-store" });
        if (res.ok) {
          await load(js);
          debug("JS associato caricato", js);
          return;
        }
      } catch (e) {
        debug("Errore fetch GET", { js, e });
      }
    }

    debug("Nessun JS trovato per questa pagina");
  }

  document.addEventListener("critical-ready", () => {
    debug("critical-ready ricevuto");
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
