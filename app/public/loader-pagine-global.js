// =========================================================
// LOADER PAGINE GLOBAL — Versione 2028.A + DEBUG
// =========================================================

(function () {

  const VERSION = "20280412";

  function debug(msg, data = null) {
    console.log(`🟦 [GLOBAL-DEBUG] ${msg}`, data || "");
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
    const p = window.location.pathname;
    debug("Pagina rilevata", p);

    // INDEX
    if (p === "/" || p.endsWith("/index.html")) {
      if (pageIsOpen("main")) await load("/index.js");
      else debug("JS NON caricato", { motivo: "HTML mancante", script: "/index.js" });
    }

    // CATALOGO
    if (p.endsWith("/catalogo.html")) {
      if (pageIsOpen("main")) await load("/catalogo.js");
      else debug("JS NON caricato", { motivo: "HTML mancante", script: "/catalogo.js" });
    }

    // PRODOTTO
    if (p.endsWith("/prodotto.html")) {
      if (pageIsOpen("main")) await load("/prodotto.js");
      else debug("JS NON caricato", { motivo: "HTML mancante", script: "/prodotto.js" });
    }

    // LOGIN / REGISTRAZIONE / RESET
    const formPages = [
      ["/login.html", "/login.js"],
      ["/registrazione.html", "/registrazione.js"],
      ["/reset-password.html", "/reset-password-request.js"],
      ["/reset-password-confirm.html", "/reset-password-confirm.js"],
      ["/reset-email.html", "/reset-email-request.js"],
      ["/reset-email-confirm.html", "/reset-email-confirm.js"]
    ];

    for (const [page, script] of formPages) {
      if (p.endsWith(page)) {
        if (pageIsOpen("form")) await load(script);
        else debug("JS NON caricato", { motivo: "HTML mancante", script });
      }
    }

    // REGOLAMENTO / FAQ / GUIDE
    const infoPages = [
      ["/regolamento.html", "/regole.js"],
      ["/FAQ.html", "/FAQ.js"],
      ["/guide.html", "/guide.js"]
    ];

    for (const [page, script] of infoPages) {
      if (p.endsWith(page)) {
        if (pageIsOpen("main")) await load(script);
        else debug("JS NON caricato", { motivo: "HTML mancante", script });
      }
    }

    // ASSISTENZA
    if (p.endsWith("/assistenza.html")) {
      if (pageIsOpen("#assistenzaForm")) {
        await load("/assistenza.js");
        await load("/chat.js");
        await load("/premium.js");
      } else {
        debug("JS NON caricato", { motivo: "HTML mancante", script: "assistenza.js" });
      }
    }

    // FLUSSI GLOBALI
    const globalFlows = [
      ["/iscrizione.html", "/iscrizione.js"],
      ["/disiscriviti.html", "/disiscrizione.js"],
      ["/cancel.html", "/cancel.js"],
      ["/thankyou.html", "/thankyou.js"],
      ["/top-recensioni.html", "/top-recensioni.js"]
    ];

    for (const [page, script] of globalFlows) {
      if (p.endsWith(page)) {
        if (pageIsOpen("main") || pageIsOpen("form")) await load(script);
        else debug("JS NON caricato", { motivo: "HTML mancante", script });
      }
    }

    debug("GLOBAL loader completato");
  }

  document.addEventListener("critical-ready", () => {
    debug("critical-ready ricevuto");
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
