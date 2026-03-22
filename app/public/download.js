/* =========================================================
   FILE: /public/download.js
   DOWNLOAD PREMIUM — Versione 2026.30
   SQL READY + ID-based + metadata + fallback
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
  ========================================================== */
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { 
        "Authorization": `Bearer ${session}`
      }
    });
    data = await res.json();
  } catch (err) {
    console.error("Errore fetch /ordini/utente:", err);
    body.innerHTML = `<tr><td colspan="3">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto acquistato.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Estrai prodotti acquistati (ID-based + metadata)
  ========================================================== */
  const prodotti = [];

  data.ordini.forEach(o => {
    if (Array.isArray(o.prodotti)) {
      o.prodotti.forEach(p => {
        prodotti.push({
          prodotto_id: p.prodotto_id,
          titolo: p.titolo || p.titolo_breve || "Prodotto digitale",
          data: o.data,
          file_consegna_url: p.file_consegna_url || null
        });
      });
    }
  });

  if (prodotti.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto disponibile.</td></tr>`;
    return;
  }

  /* =========================================================
     3) Rimuovi duplicati (stesso prodotto acquistato più volte)
  ========================================================== */
  const unici = [];
  const visti = new Set();

  prodotti.forEach(p => {
    if (!visti.has(p.prodotto_id)) {
      visti.add(p.prodotto_id);
      unici.push(p);
    }
  });

  /* =========================================================
     4) Mostra prodotti + link download sicuro (ID + token)
  ========================================================== */
  unici.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${new Date(p.data).toLocaleDateString("it-IT")}</td>
      <td>
        <a class="btn-download" 
           href="/api/vendite/download/${p.prodotto_id}?session=${session}">
          Scarica
        </a>
      </td>
    `;

    body.appendChild(tr);
  });
});
