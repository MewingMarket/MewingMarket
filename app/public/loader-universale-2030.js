// =========================================================
// LOADER UNIVERSALE 2030 — Auto‑Scan Multi‑File
// Supporta 1..N JS per pagina, nessuna lista, nessuna regola
// =========================================================

(function () {

  const VERSION = "2030.001";

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

    // 1) Nome base della pagina
    let base = path.split("/").pop() || "";
    base = base.replace(".html", "");
    debug(tag, "Nome base", base);

    // 2) Pattern universali da provare
    const patterns = [
      `${prefix}${base}.js`,
      `${prefix}${base}-*.js`,     // supporta multi-file
      `${prefix}${base}.*.js`,     // supporta varianti
      `${prefix}${base}-page.js`,
      `${prefix}${base}-controller.js`,
      `${prefix}${base}-global.js`,
      `${prefix}${base}-user.js`,
      `${prefix}${base}-admin.js`
    ];

    // 3) Auto-scan: trova TUTTI i file che matchano
    const found = [];

    for (const p of patterns) {
      // wildcard → scan directory
      if (p.includes("*")) {
        try {
          const dir = prefix.replace(/\/$/, "");
          const res = await fetch(`${dir}/`, { method: "GET", cache: "no-store" });
          const html = await res.text();

          // Estrai tutti i JS che matchano il pattern
          const regex = new RegExp(p.replace(prefix, "").replace("*", ".*"));
          const matches = [...html.matchAll(/href="([^"]+\.js)"/g)]
            .map(m => m[1])
            .filter(f => regex.test(f))
            .map(f => `${prefix}${f}`);

          found.push(...matches);
        } catch (e) {
          debug(tag, "Errore scan", e);
        }
      } else {
        // file diretto
        try {
          const res = await fetch(p, { method: "GET", cache: "no-store" });
          if (res.ok) found.push(p);
        } catch {}
      }
    }

    // 4) Rimuovi duplicati e ordina
    const unique = [...new Set(found)].sort();

    if (unique.length === 0) {
      debug(tag, "Nessun JS trovato");
      return;
    }

    debug(tag, "JS trovati", unique);

    // 5) Carica TUTTI i file trovati
    for (const js of unique) {
      await load(js, tag);
    }
  }

  // =========================================================
  // TRIAD LOADER
  // =========================================================

  document.addEventListener("critical-ready", () => {

    // GLOBAL
    run("/", "🟦 [GLOBAL]");

    // USER
    if (window.isLogged) {
      run("/", "🟩 [USER]");
    }

    // ADMIN
    if (window.isAdmin) {
      run("/admin/", "🟥 [ADMIN]");
    }

  });

})();
