// =========================================================
// LOADER PAGINE GLOBAL — Versione 2028.A
// Pagine sempre accessibili (guest + logged + admin)
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

  function pageIsOpen(sel) {
    return document.querySelector(sel) !== null;
  }

  async function run() {
    const p = window.location.pathname;

    // Shop base
    if (p === "/" || p.endsWith("/index.html")) await load("/index.js");
    if (p.endsWith("/catalogo.html") && pageIsOpen("main")) await load("/catalogo.js");
    if (p.endsWith("/prodotto.html") && pageIsOpen("main")) await load("/prodotto.js");

    // Flussi globali
    if (p.endsWith("/login.html") && pageIsOpen("form")) await load("/login.js");
    if (p.endsWith("/registrazione.html") && pageIsOpen("form")) await load("/registrazione.js");
    if (p.endsWith("/reset-password.html") && pageIsOpen("form")) await load("/reset-password-request.js");
    if (p.endsWith("/reset-password-confirm.html") && pageIsOpen("form")) await load("/reset-password-confirm.js");
    if (p.endsWith("/reset-email.html") && pageIsOpen("form")) await load("/reset-email-request.js");
    if (p.endsWith("/reset-email-confirm.html") && pageIsOpen("form")) await load("/reset-email-confirm.js");

    // Informative
    if (p.endsWith("/regolamento.html") && pageIsOpen("main")) await load("/regole.js");
    if (p.endsWith("/FAQ.html") && pageIsOpen("main")) await load("/FAQ.js");
    if (p.endsWith("/guide.html") && pageIsOpen("main")) await load("/guide.js");

    // Assistenza
    if (p.endsWith("/assistenza.html") && pageIsOpen("#assistenzaForm")) {
      await load("/assistenza.js");
      await load("/chat.js");
      await load("/premium.js");
    }

    // Flussi globali
    if (p.endsWith("/iscrizione.html") && pageIsOpen("form")) await load("/iscrizione.js");
    if (p.endsWith("/disiscriviti.html") && pageIsOpen("form")) await load("/disiscrizione.js");
    if (p.endsWith("/cancel.html") && pageIsOpen("main")) await load("/cancel.js");
    if (p.endsWith("/thankyou.html") && pageIsOpen("main")) await load("/thankyou.js");
    if (p.endsWith("/top-recensioni.html") && pageIsOpen("main")) await load("/top-recensioni.js");

    console.log("[PAGE-LOADER] Global JS loaded");
  }

  document.addEventListener("critical-ready", () => {
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
