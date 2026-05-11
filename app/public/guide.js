/* =========================================================
   GUIDE — Database locale delle guide
   Versione 2026.995
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [GUIDE] File caricato nel DOM");

/* =========================================================
   DATABASE GUIDE (TUO CODICE ORIGINALE)
========================================================= */
const guides = {
  index: {
    title: "Centro Guide & Assistenza",
    html: `
      <h2>Guide disponibili</h2>
      <ul>
        <li><a href="guide.html?topic=login">Come accedere al tuo account</a></li>
        <li><a href="guide.html?topic=registrazione">Come creare un account</a></li>
        <li><a href="guide.html?topic=download">Come scaricare un prodotto</a></li>
        <li><a href="guide.html?topic=ordini">Gestione ordini, pagamenti e annullamenti</a></li>
        <li><a href="guide.html?topic=resi">Resi e rimborsi</a></li>
        <li><a href="guide.html?topic=annulla-account">Eliminazione account</a></li>
      </ul>

      <h2>Serve aiuto?</h2>
      <p>Puoi contattarci tramite email o WhatsApp Business.</p>
    `
  },

  login: {
    title: "Come accedere al tuo account",
    html: `
      <h2>Accesso rapido</h2>
      <p>Per accedere al tuo account MewingMarket:</p>
      <ol>
        <li>Vai sulla pagina di <strong>login</strong></li>
        <li>Inserisci email e password</li>
        <li>Clicca su <strong>Accedi</strong></li>
      </ol>

      <h2>Password dimenticata</h2>
      <p>Puoi usare la procedura di reset basata sul <strong>codice fiscale</strong>.</p>
      <p>Trovi la funzione nella pagina di login.</p>
    `
  },

  registrazione: {
    title: "Come creare un account",
    html: `
      <h2>Registrazione</h2>
      <p>Per registrarti:</p>
      <ol>
        <li>Vai sulla pagina di <strong>registrazione</strong></li>
        <li>Inserisci email, password e codice fiscale</li>
        <li>Conferma la registrazione</li>
      </ol>

      <h2>Vantaggi dell’account</h2>
      <ul>
        <li>Accesso ai tuoi ordini</li>
        <li>Download dei prodotti acquistati</li>
        <li>Gestione account</li>
      </ul>
    `
  },

  download: {
    title: "Come scaricare un prodotto acquistato",
    html: `
      <h2>Email di download</h2>
      <p>Dopo il pagamento ricevi una email con il link per scaricare il file digitale.</p>

      <h2>Download dalla Dashboard</h2>
      <p>Puoi scaricare i prodotti anche dalla pagina <strong>I miei download</strong> nella Dashboard Utente.</p>

      <h2>Non trovi l’email?</h2>
      <ul>
        <li>Controlla Spam</li>
        <li>Controlla Promozioni</li>
        <li>Controlla Posta indesiderata</li>
      </ul>

      <h2>Problemi di download</h2>
      <p>Se il file non si scarica, prova da un altro browser o dispositivo.</p>
      <p>Se il problema persiste, contattaci tramite email o WhatsApp Business.</p>
    `
  },

  ordini: {
    title: "Gestione ordini, pagamenti e annullamenti",
    html: `
      <h2>Visualizzare gli ordini</h2>
      <p>Nella Dashboard trovi la pagina <strong>I miei ordini</strong> con tutti gli ordini effettuati.</p>

      <h2>Stati dell’ordine</h2>
      <ul>
        <li><strong>in_attesa_pagamento</strong>: il pagamento non è stato completato</li>
        <li><strong>completato</strong>: pagamento riuscito, download disponibile</li>
        <li><strong>annullato</strong>: ordine annullato dall’utente</li>
      </ul>

      <h2>Completare un pagamento</h2>
      <p>Se un ordine è in attesa di pagamento, puoi cliccare su <strong>Completa pagamento</strong> per rigenerare il link PayPal.</p>

      <h2>Annullare un ordine</h2>
      <ol>
        <li>Vai su <strong>Dashboard → I miei ordini</strong></li>
        <li>Clicca su <strong>Annulla</strong></li>
      </ol>

      <h2>Richiedere un rimborso</h2>
      <p>È possibile solo per ordini <strong>completati</strong>.</p>
      <p>Usa il pulsante <strong>Richiedi rimborso</strong> nella pagina ordini.</p>
    `
  },

  resi: {
    title: "Resi e rimborsi",
    html: `
      <h2>Quando è possibile richiedere un rimborso</h2>
      <ul>
        <li>File non scaricabile</li>
        <li>Errore tecnico</li>
        <li>Acquisto duplicato</li>
      </ul>

      <h2>Come richiedere un rimborso</h2>
      <p>Puoi usare la pagina <strong>Richiedi rimborso</strong> oppure scriverci via email.</p>

      <h2>Tempi di risposta</h2>
      <p>Le richieste vengono valutate entro 24–48 ore.</p>
    `
  },

  "annulla-account": {
    title: "Eliminazione account",
    html: `
      <h2>Come eliminare l’account</h2>
      <p>Vai sulla pagina <strong>Elimina account</strong> nella Dashboard.</p>

      <h2>Conferma password</h2>
      <p>Per motivi di sicurezza è necessario inserire la password attuale.</p>

      <h2>Cosa viene eliminato</h2>
      <ul>
        <li>Account</li>
        <li>Dati personali</li>
        <li>Ordini</li>
        <li>Eventi utente</li>
      </ul>

      <h2>Email di conferma</h2>
      <p>Riceverai una email automatica di conferma eliminazione.</p>
    `
  },

  default: {
    title: "Guida non trovata",
    html: "<p>La guida richiesta non esiste.</p>"
  }
};


/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [GUIDE] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [GUIDE] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [GUIDE] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [GUIDE] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [GUIDE] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [GUIDE] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [GUIDE] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [GUIDE] critical-ready già presente → avvio rendering");

  renderGuide();
}

/* =========================================================
   RENDERING ORIGINALE INCAPSULATO
========================================================= */
function renderGuide() {
  console.log("🔥 guide.js READY — rendering guida");

  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic") || "index";

  console.log("📘 [GUIDE] Topic richiesto:", topic);

  const guida = guides[topic] || guides.default;

  const breadcrumb = document.getElementById("breadcrumb-topic");
  if (breadcrumb) breadcrumb.textContent = guida.title;

  const titleEl = document.getElementById("guide-title");
  if (titleEl) titleEl.textContent = guida.title;

  const contentEl = document.getElementById("guide-content");
  if (contentEl) contentEl.innerHTML = guida.html;

  console.log("🟢 [GUIDE] Guida renderizzata:", guida.title);
}
