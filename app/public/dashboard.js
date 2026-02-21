/* =========================================================
   DASHBOARD PREMIUM — MewingMarket
   Versione definitiva: sezioni dinamiche, ordini reali,
   recensioni reali, login check, logout premium
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const content = document.getElementById("content");
  const links = document.querySelectorAll(".sidebar a");

  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");

  /* -----------------------------------------
     1) LOGIN CHECK (MODEL A)
  ----------------------------------------- */
  if (!session || !email) {
    window.location.href = "login.html?redirect=dashboard.html";
    return;
  }

  /* -----------------------------------------
     2) FUNZIONI DI SUPPORTO
  ----------------------------------------- */
  function setActive(section) {
    links.forEach(l => l.classList.remove("active"));
    const el = document.querySelector(`[data-section="${section}"]`);
    if (el) el.classList.add("active");
  }

  function render(html) {
    content.innerHTML = html;
  }

  /* -----------------------------------------
     3) SEZIONI DINAMICHE
  ----------------------------------------- */

  // PROFILO
  async function loadProfile() {
    render(`
      <h1>Profilo</h1>
      <p><strong>Email:</strong> ${email}</p>
      <p>Foto profilo: (in arrivo)</p>
    `);
  }

  // ORDINI REALI
  async function loadOrders() {
    render(`<h1>I miei ordini</h1><p>Caricamento…</p>`);

    try {
      const res = await fetch(`/api/orders?email=${encodeURIComponent(email)}`, {
        headers: { "Authorization": `Bearer ${session}` }
      });

      const data = await res.json();

      if (!data.success || data.orders.length === 0) {
        render(`
          <h1>I miei ordini</h1>
          <p>Non hai ancora effettuato acquisti.</p>
        `);
        return;
      }

      const rows = data.orders.map(o => `
        <div class="order-box">
          <p><strong>Ordine:</strong> ${o.orderId}</p>
          <p><strong>Data:</strong> ${new Date(o.date).toLocaleDateString("it-IT")}</p>
          <p><strong>Totale:</strong> ${o.totale}€</p>
          <p><strong>Prodotti:</strong></p>
          <ul>
            ${o.prodotti.map(p => `<li>${p.titolo} — ${p.prezzo}€</li>`).join("")}
          </ul>
        </div>
      `).join("");

      render(`
        <h1>I miei ordini</h1>
        ${rows}
      `);

    } catch (err) {
      render(`<h1>I miei ordini</h1><p>Errore di connessione.</p>`);
    }
  }

  // DOWNLOAD (via email)
  async function loadDownloads() {
    render(`
      <h1>Download</h1>
      <p>I tuoi file sono stati inviati via email al momento dell’acquisto.</p>
      <p>Se non li trovi, controlla la cartella spam o contattaci.</p>
    `);
  }

  // RECENSIONI REALI
  async function loadReviews() {
    render(`<h1>Le mie recensioni</h1><p>Caricamento…</p>`);

    try {
      const res = await fetch(`/api/reviews?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (!data.success || data.reviews.length === 0) {
        render(`
          <h1>Le mie recensioni</h1>
          <p>Non hai ancora lasciato recensioni.</p>
        `);
        return;
      }

      const rows = data.reviews.map(r => `
        <div class="review-box">
          <p><strong>Prodotto:</strong> ${r.product}</p>
          <p><strong>Voto:</strong> ${"★".repeat(r.rating)}</p>
          <p><strong>Commento:</strong> ${r.comment}</p>
          <p><em>${new Date(r.date).toLocaleDateString("it-IT")}</em></p>
        </div>
      `).join("");

      render(`
        <h1>Le mie recensioni</h1>
        ${rows}
      `);

    } catch (err) {
      render(`<h1>Le mie recensioni</h1><p>Errore di connessione.</p>`);
    }
  }

  // IMPOSTAZIONI
  async function loadSettings() {
    render(`
      <h1>Impostazioni account</h1>
      <p>Funzioni in arrivo.</p>
    `);
  }

  // CANCELLAZIONE ACCOUNT
  async function loadDelete() {
    render(`
      <h1>Annulla registrazione</h1>
      <p>Questa funzione eliminerà il tuo account quando il backend sarà pronto.</p>
      <button id="deleteBtn" class="btn-primario">Elimina account</button>
    `);

    document.getElementById("deleteBtn").addEventListener("click", () => {
      alert("Funzione in arrivo.");
    });
  }

  // LOGOUT
  function logout() {
    localStorage.removeItem("session");
    localStorage.removeItem("utenteEmail");
    window.location.href = "index.html";
  }

  /* -----------------------------------------
     4) ROUTER DELLA DASHBOARD
  ----------------------------------------- */
  const router = {
    profile: loadProfile,
    orders: loadOrders,
    downloads: loadDownloads,
    reviews: loadReviews,
    settings: loadSettings,
    delete: loadDelete,
    logout: logout
  };

  /* -----------------------------------------
     5) CLICK SIDEBAR
  ----------------------------------------- */
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const section = link.dataset.section;

      if (router[section]) {
        setActive(section);
        router[section]();
      }
    });
  });

  /* -----------------------------------------
     6) CARICA SEZIONE DI DEFAULT
  ----------------------------------------- */
  router.profile();
});
