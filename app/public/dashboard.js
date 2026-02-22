document.addEventListener("DOMContentLoaded", () => {
  const content = document.getElementById("content");
  const links = document.querySelectorAll(".sidebar a");

  const session = localStorage.getItem("session");
  const email = localStorage.getItem("email");

  // Solo utenti loggati
  if (!session || !email) {
    window.location.href = "login.html?redirect=dashboard.html";
    return;
  }

  function setActive(section) {
    links.forEach(l => l.classList.remove("active"));
    const el = document.querySelector(`[data-section="${section}"]`);
    if (el) el.classList.add("active");
  }

  function render(html) {
    content.innerHTML = html;
  }

  // ------------------ PROFILO (usa profilo.html + profilo.js) ------------------
  function loadProfile() {
    fetch("profilo.html")
      .then(r => r.text())
      .then(html => {
        content.innerHTML = html;
        const script = document.createElement("script");
        script.src = "profilo.js";
        content.appendChild(script);
      });
  }

  // ------------------ ORDINI (con annulla ordine) ------------------
  async function loadOrders() {
    render("<h2>I miei ordini</h2><p>Caricamento…</p>");

    try {
      const res = await fetch("/api/ordini/utente", {
        headers: {
          Authorization: "Bearer " + session,
          "x-email": email
        }
      });
      const data = await res.json();

      if (!data.success || !data.ordini || data.ordini.length === 0) {
        render("<h2>I miei ordini</h2><p>Nessun ordine trovato.</p>");
        return;
      }

      let html = `
        <h2>I miei ordini</h2>
        <table class="orders-table">
          <tr>
            <th>Data</th>
            <th>Prodotti</th>
            <th>Totale</th>
            <th>Stato</th>
            <th>Azioni</th>
          </tr>
      `;

      data.ordini.forEach(o => {
        const prodotti = (o.prodotti || [])
          .map(p => `${p.titolo} (${p.prezzo}€)`)
          .join("<br>");

        const canCancel = o.stato !== "completato" && o.stato !== "annullato";

        html += `
          <tr data-id="${o.id}">
            <td>${o.data || ""}</td>
            <td>${prodotti}</td>
            <td>${o.totale}€</td>
            <td>${o.stato}</td>
            <td>
              ${canCancel ? `<button class="btn-small danger js-cancel-order">Annulla</button>` : "-"}
            </td>
          </tr>
        `;
      });

      html += "</table>";
      render(html);

      document.querySelectorAll(".js-cancel-order").forEach(btn => {
        btn.addEventListener("click", async e => {
          const tr = e.target.closest("tr");
          const id = tr.getAttribute("data-id");
          if (!id) return;

          if (!confirm("Vuoi davvero annullare questo ordine?")) return;

          try {
            const res = await fetch(`/api/ordini/annulla/${id}`, {
              method: "POST",
              headers: {
                Authorization: "Bearer " + session,
                "x-email": email
              }
            });
            const out = await res.json();
            if (out.success) {
              loadOrders();
            } else {
              alert(out.error || "Impossibile annullare l'ordine.");
            }
          } catch {
            alert("Errore di connessione.");
          }
        });
      });

    } catch {
      render("<h2>I miei ordini</h2><p>Errore di connessione.</p>");
    }
  }

  // ------------------ DOWNLOAD PROTETTI ------------------
  async function loadDownloads() {
    render("<h2>Download</h2><p>Caricamento…</p>");

    try {
      const res = await fetch("/api/ordini/utente", {
        headers: {
          Authorization: "Bearer " + session,
          "x-email": email
        }
      });
      const data = await res.json();

      if (!data.success || !data.ordini || data.ordini.length === 0) {
        render("<h2>Download</h2><p>Nessun prodotto acquistato.</p>");
        return;
      }

      let prodotti = [];
      data.ordini.forEach(o => {
        if (o.stato === "completato" && Array.isArray(o.prodotti)) {
          prodotti.push(...o.prodotti);
        }
      });

      if (prodotti.length === 0) {
        render("<h2>Download</h2><p>Nessun prodotto scaricabile.</p>");
        return;
      }

      let html = "<h2>Download</h2>";
      prodotti.forEach(p => {
        html += `
          <div class="download-item">
            <strong>${p.titolo}</strong><br>
            <a href="/api/vendite/download/${p.slug}" class="btn-small">Scarica</a>
          </div>
        `;
      });

      render(html);

    } catch {
      render("<h2>Download</h2><p>Errore di connessione.</p>");
    }
  }

  // ------------------ RECENSIONI / IMPOSTAZIONI PLACEHOLDER ------------------
  function loadReviews() {
    render("<h2>Le mie recensioni</h2><p>Funzione in arrivo.</p>");
  }

  function loadSettings() {
    render("<h2>Impostazioni</h2><p>Funzione in arrivo.</p>");
  }

  // ------------------ ELIMINAZIONE ACCOUNT ------------------
  function loadDelete() {
    render(`
      <h2>Annulla registrazione</h2>
      <p>Questa azione disattiverà il tuo account e terminerà la sessione.</p>
      <button id="btnDeleteAccount" class="btn-small danger">Elimina account</button>
      <p id="msgDelete"></p>
    `);

    document.getElementById("btnDeleteAccount").onclick = async () => {
      try {
        const res = await fetch("/api/utente/profilo/elimina", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + session,
            "x-email": email
          }
        });
        const data = await res.json();
        if (data.success) {
          localStorage.clear();
          window.location.href = "login.html";
        } else {
          document.getElementById("msgDelete").textContent = data.error || "Errore.";
        }
      } catch {
        document.getElementById("msgDelete").textContent = "Errore di connessione.";
      }
    };
  }

  // ------------------ LOGOUT ------------------
  function logout() {
    localStorage.clear();
    window.location.href = "index.html";
  }

  const router = {
    profile: loadProfile,
    orders: loadOrders,
    downloads: loadDownloads,
    reviews: loadReviews,
    settings: loadSettings,
    delete: loadDelete,
    logout: logout
  };

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

  // sezione di default
  router.profile();
});
