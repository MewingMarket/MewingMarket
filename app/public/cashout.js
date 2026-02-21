/* =========================================================
   CHECKOUT — legge il carrello, controlla login e avvia pagamento
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const cart = Cart.get(); // dal carrello.js
  const tbody = document.querySelector("#checkout-table tbody");
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
     — LOGIN CHECK
     — CREAZIONE ORDINE
     — REDIRECT PAYPAL
  ============================ */
  btnPaga.addEventListener("click", async () => {
    if (cart.length === 0) {
      alert("Il carrello è vuoto.");
      return;
    }

    const session = localStorage.getItem("session");
    const email = localStorage.getItem("utenteEmail");

    if (!session || !email) {
      window.location.href = "dashboard-login.html?redirect=checkout";
      return;
    }

    try {
      // CREA ORDINE LATO BACKEND
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session}`
        },
        body: JSON.stringify({
          email,
          prodotti: cart,
          totale
        })
      });

      const data = await res.json();

      if (!data.success || !data.paypalUrl) {
        alert(data.error || "Errore creazione ordine.");
        return;
      }

      // REDIRECT A PAYPAL LIVE
      window.location.href = data.paypalUrl;

    } catch (err) {
      console.error(err);
      alert("Errore di connessione.");
    }
  });
});
