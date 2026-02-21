document.addEventListener("DOMContentLoaded", () => {

  const ordersBody = document.getElementById("ordersBody");

  // FUTURO BACKEND:
  // const res = await fetch("/api/orders/list?email=" + utenteEmail);
  // const orders = await res.json();

  // Per ora: placeholder
  const fakeOrders = [
    {
      prodotto: "Corso Avanzato",
      prezzo: "29",
      data: "2025-01-10",
      stato: "Completato"
    }
  ];

  fakeOrders.forEach(o => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.prodotto}</td>
      <td>${o.prezzo}€</td>
      <td>${o.data}</td>
      <td>${o.stato}</td>
      <td><button class="cancelBtn">Annulla</button></td>
    `;
    ordersBody.appendChild(tr);
  });

  // Annullamento ordine (frontend-only)
  ordersBody.addEventListener("click", e => {
    if (e.target.classList.contains("cancelBtn")) {
      alert("Funzione annullamento ordine pronta per il backend.");
    }
  });

});
