document.addEventListener("DOMContentLoaded", () => {

  const content = document.getElementById("content");
  const links = document.querySelectorAll(".sidebar a");

  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");

  if (!session || !email) {
    location.href = "dashboard-login.html";
    return;
  }

  // SEZIONI FRONTEND-ONLY
  const sections = {
    profile: `
      <h1>Profilo</h1>
      <p>Email: <strong>${email}</strong></p>
      <p>Foto profilo: (in arrivo)</p>
    `,
    orders: `
      <h1>I miei ordini</h1>
      <p>Gli ordini appariranno qui quando il backend sarà pronto.</p>
    `,
    downloads: `
      <h1>Download</h1>
      <p>I tuoi prodotti scaricabili appariranno qui.</p>
    `,
    reviews: `
      <h1>Le mie recensioni</h1>
      <p>Le recensioni appariranno qui.</p>
    `,
    settings: `
      <h1>Impostazioni account</h1>
      <p>Funzioni in arrivo.</p>
    `,
    delete: `
      <h1>Annulla registrazione</h1>
      <p>Questa funzione eliminerà il tuo account quando il backend sarà pronto.</p>
      <button id="deleteBtn" class="btn-primario">Elimina account</button>
    `
  };

  // CARICA SEZIONE
  function load(section) {
    content.innerHTML = sections[section] || "<p>Sezione non trovata.</p>";

    links.forEach(l => l.classList.remove("active"));
    document.querySelector(`[data-section="${section}"]`).classList.add("active");

    if (section === "logout") {
      localStorage.removeItem("session");
      localStorage.removeItem("utenteEmail");
      location.href = "/";
    }
  }

  // CLICK SIDEBAR
  links.forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      load(link.dataset.section);
    });
  });

  // CARICA DEFAULT
  load("profile");
});
