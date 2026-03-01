document.addEventListener("DOMContentLoaded", async () => {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");
  const body = document.getElementById("ordersBody");

  if (!session || !email) {
    body.innerHTML = `<tr><td colspan="5">Devi effettuare il login.</td></tr>`;
    return;
  }

  // 1) Recupera ordini dell’utente
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { "x-token": session }
    });
    data = await res.json();
  } catch (err) {
    console.error(err);
    body.innerHTML = `<tr><td colspan="5">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  // 2) Mostra ordini
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    const prodottiHTML = Array.isArray(o.prodotti)
      ? o.prodotti.map(p => `${p.titolo} (${p.prezzo}€)`).join("<br>")
      : "-";

    const downloadBtns = Array.isArray(o.prodotti)
      ? o.prodotti
          .map(
            p => `<a class="btn-download" href="/api/vendite/download/${p.slug}?token=${session}">Download</a>`
          )
          .join("<br>")
      : "-";

    // PATCH: bottone annulla ordine → redirect a cancel.html
    const annullaBtn =
      o.stato !== "COMPLETED" && o.stato !== "CANCELLED"
        ? `<a class="btn-cancel" href="paypal/cancel/index.html?orderId=${o.orderId}">
             Annulla ordine
           </a>`
        : "";

    tr.innerHTML = `
      <td>${new Date(o.data).toLocaleDateString("it-IT")}</td>
      <td>${prodottiHTML}</td>
      <td>${o.totale}€</td>
      <td>${o.stato}</td>
      <td>${downloadBtns}<br>${annullaBtn}</td>
    `;

    body.appendChild(tr);
  });
});
