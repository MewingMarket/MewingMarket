// =========================================================
// File: app/public/admin/js/index.js
// Dashboard Admin principale
// =========================================================

async function caricaStats() {
  try {
    const res = await fetch("/api/admin/stats");
    const data = await res.json();

    if (!data.success) return;

    document.getElementById("stat-vendite").textContent = data.stats.venditeTotali;
    document.getElementById("stat-ordini").textContent = data.stats.ordiniTotali;
    document.getElementById("stat-prodotti").textContent = data.stats.prodottiAttivi;

  } catch (err) {
    console.error(err);
  }
}

async function caricaUltimiOrdini() {
  try {
    const res = await fetch("/api/admin/orders/latest");
    const data = await res.json();

    if (!data.success) return;

    const tbody = document.querySelector("#tabella-ultimi-ordini tbody");
    tbody.innerHTML = "";

    data.ordini.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.data}</td>
        <td>${o.prodotto}</td>
        <td>${o.prezzo} €</td>
        <td>${o.email}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  caricaStats();
  caricaUltimiOrdini();
});
