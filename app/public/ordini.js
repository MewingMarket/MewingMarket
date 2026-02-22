document.addEventListener("DOMContentLoaded", async () => {

  const ordersBody = document.getElementById("ordersBody");

  // ============================================================
  // 0) RECUPERA SESSIONE UTENTE
  // ============================================================
  const session = localStorage.getItem("session");
  if (!session) {
    ordersBody.innerHTML = `<tr><td colspan="5">Devi effettuare il login per vedere i tuoi ordini.</td></tr>`;
    return;
  }

  // ============================================================
  // 1) CARICA ORDINI UTENTE
  // ============================================================
  let data;
  try {
    const res = await fetch(`/api/ordini/utente/${session}`);
    data = await res.json();
  } catch (err) {
    console.error(err);
    ordersBody.innerHTML = `<tr><td colspan="5">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    ordersBody.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  // ============================================================
  // 2) MOSTRA ORDINI
  // ============================================================
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    // Prodotti formattati
    const prodottiHTML = Array.isArray(o.prodotti)
      ? o.prodotti.map(p => `${p.titolo} (${p.prezzo}€)`).join("<br>")
      : "-";

    // Bottone annulla ordine (solo se non pagato)
    const annullaBtn =
      o.stato === "in_attesa_pagamento"
        ? `<button class="btn-small-red" onclick="annullaOrdine('${o.paypal_transaction_id}')">Annulla</button>`
        : "";

    // Pulsanti download
    const downloadBtns = Array.isArray(o.prodotti)
      ? o.prodotti
          .map(
            p => `<a href="/api/vendite/download/${p.slug}" class="btn-small">Download</a>`
          )
          .join("<br>")
      : "-";

    tr.innerHTML = `
      <td>${o.data || "-"}</td>
      <td>${prodottiHTML}</td>
      <td>${o.totale || 0}€</td>
      <td>${o.stato || "-"}</td>
      <td>
        ${downloadBtns}
        <br>
        ${annullaBtn}
      </td>
    `;

    ordersBody.appendChild(tr);
  });

});

// ============================================================
// FUNZIONE — REINDIRIZZA ALLA CANCEL PAGE
// ============================================================
function annullaOrdine(orderId) {
  window.location.href = `cancel.html?orderId=${orderId}`;
}
