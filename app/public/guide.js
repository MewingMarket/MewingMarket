document.addEventListener("DOMContentLoaded", () => {

  const params = new URLSearchParams(location.search);
  const topic = params.get("topic") || "default";

  const titleEl = document.getElementById("guide-title");
  const contentEl = document.getElementById("guide-content");
  const breadcrumbEl = document.getElementById("breadcrumb-topic");
  const indexBox = document.getElementById("guide-index");
  const indexList = document.getElementById("guide-index-list");

  // ============================
  //  DATABASE DELLE GUIDE
  // ============================

  const guides = {

    login: {
      title: "Come accedere al tuo account",
      html: `
        <h2>Accesso rapido</h2>
        <p>Per accedere al tuo account MewingMarket:</p>
        <ol>
          <li>Vai su <strong>dashboard-login.html</strong></li>
          <li>Inserisci email e password</li>
          <li>Clicca su <strong>Accedi</strong></li>
        </ol>

        <h2>Password dimenticata</h2>
        <p>Usa la funzione “Reset password” nella pagina di login.</p>
      `
    },

    registrazione: {
      title: "Come creare un account",
      html: `
        <h2>Registrazione</h2>
        <p>Per registrarti:</p>
        <ol>
          <li>Vai su <strong>dashboard-register.html</strong></li>
          <li>Inserisci email e password</li>
          <li>Conferma la registrazione</li>
        </ol>

        <h2>Vantaggi dell’account</h2>
        <ul>
          <li>Accesso ai tuoi ordini</li>
          <li>Download prodotti</li>
          <li>Recensioni</li>
          <li>Impostazioni account</li>
        </ul>
      `
    },

    download: {
      title: "Come scaricare un prodotto acquistato",
      html: `
        <h2>Email di download</h2>
        <p>Dopo l’acquisto riceverai una email con il link di download.</p>

        <h2>Non trovi l’email?</h2>
        <ul>
          <li>Controlla Spam</li>
          <li>Controlla Promozioni</li>
          <li>Controlla Posta indesiderata</li>
        </ul>

        <h2>Dashboard (in arrivo)</h2>
        <p>In futuro potrai scaricare i prodotti anche dalla dashboard.</p>
      `
    },

    ordini: {
      title: "Gestione ordini e annullamenti",
      html: `
        <h2>Visualizzare gli ordini</h2>
        <p>Nella dashboard puoi vedere tutti i tuoi ordini.</p>

        <h2>Annullare un ordine</h2>
        <ol>
          <li>Vai su <strong>Dashboard → I miei ordini</strong></li>
          <li>Seleziona l’ordine</li>
          <li>Clicca su <strong>Annulla ordine</strong></li>
        </ol>

        <h2>Email di conferma</h2>
        <p>Riceverai una email automatica di conferma annullamento.</p>
      `
    },

    resi: {
      title: "Resi e rimborsi",
      html: `
        <h2>Politica resi</h2>
        <p>I prodotti digitali non prevedono reso automatico.</p>

        <h2>Quando è possibile</h2>
        <ul>
          <li>File non scaricabile</li>
          <li>Errore tecnico</li>
          <li>Acquisto duplicato</li>
        </ul>

        <h2>Come richiedere un rimborso</h2>
        <p>Scrivi a <strong>supporto@mewingmarket.it</strong> o usa WhatsApp Business.</p>
      `
    },

    "annulla-account": {
      title: "Eliminazione account",
      html: `
        <h2>Come eliminare l’account</h2>
        <p>Vai su <strong>Dashboard → Impostazioni → Annulla registrazione</strong>.</p>

        <h2>Email di conferma</h2>
        <p>Riceverai una email automatica di conferma eliminazione.</p>
      `
    },

    default: {
      title: "Guida non trovata",
      html: "<p>La guida richiesta non esiste.</p>"
    }
  };

  // ============================
  //  CARICAMENTO GUIDA
  // ============================

  const guide = guides[topic] || guides.default;

  titleEl.textContent = guide.title;
  breadcrumbEl.textContent = guide.title;
  contentEl.innerHTML = guide.html;

  // ============================
  //  INDICE AUTOMATICO
  // ============================

  const headers = contentEl.querySelectorAll("h2, h3");

  if (headers.length > 0) {
    indexBox.style.display = "block";
    headers.forEach((h, i) => {
      const id = "section-" + i;
      h.id = id;

      const li = document.createElement("li");
      li.innerHTML = `<a href="#${id}">${h.textContent}</a>`;
      indexList.appendChild(li);
    });
  }

  // ============================
  //  RICERCA INTERNA
  // ============================

  document.getElementById("guide-search-btn").onclick = () => {
    const q = document.getElementById("guide-search-input").value.toLowerCase();
    if (!q) return;

    const paragraphs = contentEl.querySelectorAll("p, li");

    paragraphs.forEach(p => {
      p.style.background = "";
      if (p.textContent.toLowerCase().includes(q)) {
        p.style.background = "yellow";
      }
    });
  };

});
