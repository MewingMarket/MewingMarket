// app/public/admin/js/ordini.js

async function caricaOrdini() {
  const res = await adminFetch("/api/admin/ordini/lista");
  const data = await res.json();

  if (!data.success) return;

  document.getElementById("ordini-totali").textContent = data.stats.totali;
  document.getElementById("ordini-completati").textContent = data.stats.completati;
  document.getElementById("ordini-abbandonati").textContent = data.stats.abbandonati;

  const tbody = document.querySelector("#tabella-ordini tbody");
  tbody.innerHTML = "";

  data.ordini.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.prodotto}</td>
      <td>${o.prezzo}</td>
      <td>${o.stato}</td>
      <td>${o.email}</td>
      <td>${o.origine}</td>
      <td>${o.data}</td>
    `;
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", caricaOrdini);
