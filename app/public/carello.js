document.addEventListener("DOMContentLoaded", () => {
  const cart = Cart.get();
  const tbody = document.querySelector("#cashout-table tbody");
  const totaleEl = document.querySelector("#totale");
  const daPagareEl = document.querySelector("#da-pagare");

  let totale = 0;

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

  // Rimozione
  tbody.addEventListener("click", e => {
    if (e.target.classList.contains("rimuovi")) {
      const slug = e.target.dataset.slug;
      Cart.remove(slug);
      location.reload();
    }
  });
});
