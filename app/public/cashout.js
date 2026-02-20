/* =========================================================
   CASHOUT — legge il carrello e prepara il pagamento
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const cart = Cart.get(); // dal carrello.js
  const tbody = document.querySelector("#cashout-table tbody");
  const totaleEl = document.querySelector("#totale");
  const daPagareEl = document.querySelector("#da-pagare");
  const btnPaga = document.getElementById("btn-paga");

  tbody.innerHTML = "";
  let totale = 0;

  /* ============================
     RENDER PRODOTTI NEL CARRELLO
  ============================ */
  cart.forEach(p => {
    totale += Number(p.prezzo);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${p.prezzo}€</td>
      <td><button data-slug="${p.slug}" class="rimuovi">Rimuovi</button></td>
    `;
    tbody.appendChild(tr);
  });

  totaleEl.textContent = totale.toFixed(2);
  daPagareEl.textContent = totale.toFixed(2);

  /* ============================
     RIMOZIONE DAL CARRELLO
  ============================ */
  tbody.addEventListener("click", e => {
    if (e.target.classList.contains("rimuovi")) {
      const slug = e.target.dataset.slug;
      Cart.remove(slug);
      location.reload();
    }
  });

  /* ============================
     PULSANTE "PAGA ORA"
     (per ora redirect semplice)
  ============================ */
  btnPaga.addEventListener("click", () => {
    if (cart.length === 0) {
      alert("Il carrello è vuoto.");
      return;
    }

    // Qui in futuro collegheremo PayPal
    alert("Pagamento non ancora configurato.");
  });
});
