// =========================================================
// LOADER PAGINE GLOBAL — Versione 2028.B UNIVERSALE
// Nessuna lista, nessuna mappatura, nessuna convenzione
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟦 [GLOBAL-DEBUG] ${msg}`, data || "");
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

    const path = window.location.pathname;
    debug("Pagina rilevata", path);

    // 1) Estrai nome base della pagina
    let base = path.split("/").pop() || "index.html";
    base = base.replace(".html", "");
    debug("Nome base HTML", base);

    // 2) Costruisci possibili JS compatibili
    const candidates = [
      `/${base}.js`,
      `/${base}-page.js`,
      `/${base}-controller.js`,
      `/${base}-global.js`
    ];

    // 3) Prova a caricare il primo JS che esiste
    for (const js of candidates) {
      try {
        const res = await fetch(js, { method: "HEAD" });
        if (res.ok) {
          await load(js);
          debug("JS associato caricato", js);
          return;
        }
      } catch {}
    }

    debug("Nessun JS trovato per questa pagina");
  }

  document.addEventListener("critical-ready", () => {
    debug("critical-ready ricevuto");
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
