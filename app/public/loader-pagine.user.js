// =========================================================
// LOADER PAGINE USER — Versione 2028.B UNIVERSALE (PATCH GET)
// Nessuna lista, nessuna mappatura, nessuna convenzione
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟩 [USER-DEBUG] ${msg}`, data || "");
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

    if (!window.isLogged) {
      debug("Ignorato: utente NON loggato");
      return;
    }

    const path = window.location.pathname;
    debug("Pagina rilevata", path);

    // 1) Estrai nome base della pagina
    let base = path.split("/").pop() || "";
    base = base.replace(".html", "");
    debug("Nome base HTML", base);

    // 2) Costruisci possibili JS compatibili
    const candidates = [
      `/${base}.js`,
      `/${base}-user.js`,
      `/${base}-page.js`,
      `/${base}-controller.js`
    ];

    // 3) PATCH: usa GET invece di HEAD
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
