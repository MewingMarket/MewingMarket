async function loadOrders() {
  const res = await fetch("/api/ordini");
  const data = await res.json();
  return data.orders || [];
}

function renderCashout(orders) {
  const tbody = document.querySelector("#cashout-table tbody");
  tbody.innerHTML = "";

  let totale = 0;

  orders.forEach(o => {
    if (o.stato === "paid") totale += Number(o.prezzo);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.prodotto_slug}</td>
      <td>${o.email_cliente}</td>
      <td>${o.prezzo}€</td>
      <td>${o.stato}</td>
    `;
    tbody.appendChild(tr);
  });

  document.querySelector("#totale").textContent = totale.toFixed(2);
  document.querySelector("#da-pagare").textContent = totale.toFixed(2);
}

(async () => {
  const orders = await loadOrders();
  renderCashout(orders);
})();
