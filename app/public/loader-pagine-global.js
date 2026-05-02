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

  async function run() {
    const p = window.location.pathname;

    // Pagine base shop
    if (p === "/" || p.endsWith("/index.html")) await load("/index.js");
    if (p.endsWith("/catalogo.html")) await load("/catalogo.js");
    if (p.endsWith("/prodotto.html")) await load("/prodotto.js");

    // Flussi globali (prima del login)
    if (p.endsWith("/login.html")) await load("/login.js");
    if (p.endsWith("/registrazione.html")) await load("/registrazione.js");
    if (p.endsWith("/reset-password.html")) await load("/reset-password-request.js");
    if (p.endsWith("/reset-password-confirm.html")) await load("/reset-password-confirm.js");
    if (p.endsWith("/reset-email.html")) await load("/reset-email-request.js");
    if (p.endsWith("/reset-email-confirm.html")) await load("/reset-email-confirm.js");

    // Pagine informative
    if (p.endsWith("/regolamento.html")) await load("/regole.js");
    if (p.endsWith("/FAQ.html")) await load("/FAQ.js");
    if (p.endsWith("/guide.html")) await load("/guide.js");

    // Assistenza + chat
    if (p.endsWith("/assistenza.html")) {
      await load("/assistenza.js");
      await load("/chat.js");
      await load("/premium.js");
    }

    // Flussi globali (non user)
    if (p.endsWith("/iscrizione.html")) await load("/iscrizione.js");
    if (p.endsWith("/disiscriviti.html")) await load("/disiscrizione.js");
    if (p.endsWith("/cancel.html")) await load("/cancel.js");
    if (p.endsWith("/thankyou.html")) await load("/thankyou.js");
    if (p.endsWith("/top-recensioni.html")) await load("/top-recensioni.js");

    console.log("[PAGE-LOADER] Global JS loaded");
  }

  document.addEventListener("critical-ready", () => {
    setTimeout(() => requestAnimationFrame(run), 50);
  });

})();
