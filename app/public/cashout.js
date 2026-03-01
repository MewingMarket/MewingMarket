/* =========================================================
   FILE: /public/checkout.js
   CHECKOUT PREMIUM — MewingMarket
   Versione definitiva: login check, single/multi, PayPal,
   badge carrello, redirect thank you
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  // 1) LOGIN CHECK
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");

  if (!session || !email) {
    window.location.href = "login.html?redirect=checkout.html";
    return;
  }

  // 2) BADGE
  if (typeof aggiornaBadgeCarrello === "function") {
    aggiornaBadgeCarrello();
  }

  // 3) MODE
  const mode = getCheckoutMode();
  let prodotti = [];
  let totale = 0;

  if (mode === "single") {
    const single = getSingleProduct();
    if (!single) {
      window.location.href = "catalogo.html";
      return;
    }
    prodotti = [single];
    totale = Number(single.prezzo) * (single.qty || 1);
  } else {
    prodotti = Cart.get();
    if (prodotti.length === 0) {
      window.location.href = "catalogo.html";
      return;
    }
    totale = Cart.total();
  }

  // 4) RENDER TABELLA
  const tbody = document.querySelector("#checkout-table tbody");
  const totaleEl = document.querySelector("#totale");
  const daPagareEl = document.querySelector("#da-pagare");

  tbody.innerHTML = "";

  prodotti.forEach(p => {
    const qty = p.qty || 1;
    const subtotal = (p.prezzo * qty).toFixed(2);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${p.prezzo}€</td>
      <td>${qty}</td>
      <td>${subtotal}€</td>
      <td><button data-slug="${p.slug}" class="rimuovi">Rimuovi</button></td>
    `;
    tbody.appendChild(tr);
  });

  totaleEl.textContent = totale.toFixed(2);
  daPagareEl.textContent = totale.toFixed(2);

  // 5) RIMOZIONE
  tbody.addEventListener("click", e => {
    if (!e.target.classList.contains("rimuovi")) return;

    const slug = e.target.dataset.slug;

    Cart.remove(slug);

    if (mode === "single") {
      window.location.href = "catalogo.html";
      return;
    }

    location.reload();
  });

  // 6) PAGA ORA
  const btnPaga = document.getElementById("btn-paga");

  btnPaga.addEventListener("click", async () => {
    if (prodotti.length === 0) {
      alert("Il carrello è vuoto.");
      return;
    }

    btnPaga.disabled = true;
    btnPaga.textContent = "Elaborazione…";

    try {
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session}`
        },
        body: JSON.stringify({
          email,
          prodotti,
          totale,
          mode
        })
      });

      const data = await res.json();

      if (!data.success || !data.paypalUrl) {
        alert(data.error || "Errore creazione ordine.");
        btnPaga.disabled = false;
        btnPaga.textContent = "Procedi al pagamento";
        return;
      }

      window.location.href = data.paypalUrl;

    } catch (err) {
      console.error(err);
      alert("Errore di connessione.");
      btnPaga.disabled = false;
      btnPaga.textContent = "Procedi al pagamento";
    }
  });
});
