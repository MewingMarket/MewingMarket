// =========================================================
// LOADER UNIVERSALE 2030 — Compatibile Render
// Carica 1..N JS per pagina senza directory listing
// =========================================================

(function () {

  const VERSION = "2030.002";

  function debug(tag, msg, data = null) {
    console.log(`${tag} ${msg}`, data || "");
  }

  function load(src, tag) {
    debug(tag, "Caricamento", src);
    return new Promise(r => {
      const s = document.createElement("script");
      s.src = `${src}?v=${VERSION}`;
      s.defer = true;
      s.onload = () => { debug(tag, "Caricato", src); r(); };
      s.onerror = () => { debug(tag, "ERRORE", src); r(); };
      document.body.appendChild(s);
    });
  }

  async function run(prefix, tag) {

    const path = window.location.pathname;
    debug(tag, "Pagina rilevata", path);

    let base = path.split("/").pop() || "";
    base = base.replace(".html", "");
    debug(tag, "Nome base", base);

    // Lista di pattern possibili (1..N file)
    const candidates = [
      `${prefix}${base}.js`,
      `${prefix}${base}-page.js`,
      `${prefix}${base}-controller.js`,
      `${prefix}${base}-global.js`,
      `${prefix}${base}-user.js`,
      `${prefix}${base}-admin.js`,
      `${prefix}${base}-1.js`,
      `${prefix}${base}-2.js`,
      `${prefix}${base}-3.js`,
      `${prefix}${base}-extra.js`,
      `${prefix}${base}-module.js`
    ];

    const found = [];

    for (const js of candidates) {
      try {
        const res = await fetch(js, { method: "GET", cache: "no-store" });
        if (res.ok) found.push(js);
      } catch {}
    }

    if (found.length === 0) {
      debug(tag, "Nessun JS trovato");
      return;
    }

    debug(tag, "JS trovati", found);

    for (const js of found) {
      await load(js, tag);
    }
  }

  document.addEventListener("critical-ready", () => {

    run("/", "🟦 [GLOBAL]");

    if (window.isLogged) {
      run("/", "🟩 [USER]");
    }

    if (window.isAdmin) {
      run("/admin/", "🟥 [ADMIN]");
    }

  });

})();
