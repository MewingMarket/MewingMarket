/* =========================================================
   FILE: /public/download.js
   DOWNLOAD PREMIUM — MewingMarket
   Versione corretta: sessione unificata + download sicuri
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");

  const body = document.getElementById("downloadBody");

  if (!session || !email) {
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login.</td></tr>`;
    return;
  }

  /* =========================================================
     1) Recupera ordini dell’utente
  ========================================================= */
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { 
        "Authorization": `Bearer ${session}`
      }
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

  /* =========================================================
     2) Estrai tutti i prodotti acquistati
  ========================================================= */
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

  /* =========================================================
     3) Mostra prodotti + link download sicuro
  ========================================================= */
  prodotti.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${new Date(p.data).toLocaleDateString("it-IT")}</td>
      <td>
        <a class="btn-download" href="/api/vendite/download/${p.slug}">
          Scarica
        </a>
      </td>
    `;

    body.appendChild(tr);
  });
});
