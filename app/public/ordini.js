async function loadOrders() {
  const res = await fetch("/api/ordini");
  const data = await res.json();
  return data.orders || [];
}

function renderOrders(orders) {
  const tbody = document.querySelector("#ordini-table tbody");
  tbody.innerHTML = "";

  orders.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.prodotto_slug}</td>
      <td>${o.email_cliente}</td>
      <td>${o.prezzo}€</td>
      <td>${o.stato}</td>
      <td>${new Date(o.data).toLocaleString()}</td>
    `;
    tbody.appendChild(tr);
  });
}

(async () => {
  const orders = await loadOrders();
  renderOrders(orders);

  document.querySelector("#search").addEventListener("input", e => {
    const q = e.target.value.toLowerCase();
    const filtered = orders.filter(o =>
      o.email_cliente.toLowerCase().includes(q) ||
      o.prodotto_slug.toLowerCase().includes(q)
    );
    renderOrders(filtered);
  });
})();
