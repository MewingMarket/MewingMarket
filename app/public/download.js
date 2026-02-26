document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("utenteEmail");

  const body = document.getElementById("downloadBody");

  if (!token || !email) {
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login.</td></tr>`;
    return;
  }

  // 1) Recupera ordini dell’utente
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { "x-token": token }
    });
    data = await res.json();
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="3">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto acquistato.</td></tr>`;
    return;
  }

  // 2) Estrai tutti i prodotti acquistati
  const prodotti = [];

  data.ordini.forEach(o => {
    if (Array.isArray(o.prodotti)) {
      o.prodotti.forEach(p => {
        prodotti.push({
          titolo: p.titolo,
          slug: p.slug,
          data: o.data
        });
      });
    }
  });

  if (prodotti.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto disponibile.</td></tr>`;
    return;
  }

  // 3) Mostra prodotti
  prodotti.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${new Date(p.data).toLocaleDateString("it-IT")}</td>
      <td>
        <a class="btn-download" href="/api/vendite/download/${p.slug}?token=${token}">
          Scarica
        </a>
      </td>
    `;

    body.appendChild(tr);
  });
});
