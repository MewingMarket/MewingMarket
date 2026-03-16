// =========================================================
// CHECKOUT PREMIUM – MewingMarket (SQL + PAYPAL READY)
// Versione definitiva: login check + multi/single + qty + totale + PayPal
// =========================================================

/* =========================================================
   1) LOGIN CHECK
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!isLogged()) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const redirectURL = id
      ? `login.html?redirect=checkout.html?id=${id}`
      : `login.html?redirect=checkout.html`;

    window.location.href = redirectURL;
    return;
  }

  initCheckout();
});

/* =========================================================
   2) INIZIALIZZAZIONE CHECKOUT
========================================================= */
function initCheckout() {
  const mode = getCheckoutMode(); // single | multi

  if (mode === "single") {
    renderSingleCheckout();
  } else {
    renderMultiCheckout();
  }

  aggiornaBadgeCarrello();
}

/* =========================================================
   3) CHECKOUT SINGOLO PRODOTTO
========================================================= */
function renderSingleCheckout() {
  const prodotto = getSingleProduct();

  if (!prodotto) {
    document.getElementById("checkout-container").innerHTML =
      "<p>Prodotto non trovato nel carrello.</p>";
    return;
  }

  const prezzo = prodotto.prezzo_cent / 100;

  document.getElementById("checkout-container").innerHTML = `
    <h2>Checkout — Acquisto Singolo</h2>

    <div class="checkout-item">
      <img src="${prodotto.immagine}" alt="${prodotto.titolo}">
      <div>
        <h3>${prodotto.titolo}</h3>
        <p>Prezzo: €${prezzo}</p>
      </div>
    </div>

    <div class="checkout-totale">
      <h3>Totale: €${prezzo}</h3>
    </div>

    <button id="btn-paga" class="btn-primario">Paga con PayPal</button>
  `;

  document.getElementById("btn-paga").addEventListener("click", () => {
    pagaOrdine([prodotto]);
  });
}

/* =========================================================
   4) CHECKOUT MULTIPLO (CARRELLO)
========================================================= */
function renderMultiCheckout() {
  const items = Cart.get();

  if (!items.length) {
    document.getElementById("checkout-container").innerHTML =
      "<p>Il carrello è vuoto.</p>";
    return;
  }

  let html = `
    <h2>Checkout — Carrello</h2>
    <div class="checkout-list">
  `;

  items.forEach((p) => {
    const prezzo = p.prezzo_cent / 100;

    html += `
      <div class="checkout-item" data-id="${p.id}">
        <img src="${p.immagine}" alt="${p.titolo}">
        <div class="info">
          <h3>${p.titolo}</h3>
          <p>Prezzo: €${prezzo}</p>

          <div class="qty-box">
            <button class="qty-minus" data-id="${p.id}">-</button>
            <span class="qty">${p.qty}</span>
            <button class="qty-plus" data-id="${p.id}">+</button>
          </div>
        </div>

        <button class="btn-remove" data-id="${p.id}">Rimuovi</button>
      </div>
    `;
  });

  html += `</div>`;

  html += `
    <div class="checkout-totale">
      <h3>Totale: €${Cart.total()}</h3>
    </div>

    <button id="btn-paga" class="btn-primario">Paga con PayPal</button>
  `;

  document.getElementById("checkout-container").innerHTML = html;

  bindQtyButtons();
  bindRemoveButtons();

  document.getElementById("btn-paga").addEventListener("click", () => {
    pagaOrdine(items);
  });
}

/* =========================================================
   5) QUANTITÀ (+ / -)
========================================================= */
function bindQtyButtons() {
  document.querySelectorAll(".qty-plus").forEach((btn) => {
    btn.addEventListener("click", () => {
      Cart.updateQty(Number(btn.dataset.id), +1);
      renderMultiCheckout();
    });
  });

  document.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      Cart.updateQty(Number(btn.dataset.id), -1);
      renderMultiCheckout();
    });
  });
}

/* =========================================================
   6) RIMOZIONE PRODOTTO
========================================================= */
function bindRemoveButtons() {
  document.querySelectorAll(".btn-remove").forEach((btn) => {
    btn.addEventListener("click", () => {
      Cart.remove(Number(btn.dataset.id));
      renderMultiCheckout();
      aggiornaBadgeCarrello();
    });
  });
}

/* =========================================================
   7) PAGAMENTO (SQL + PAYPAL)
========================================================= */
async function pagaOrdine(items) {
  if (!items || !items.length) {
    alert("Nessun prodotto da acquistare.");
    return;
  }

  const email = getUserEmail();
  const prodotti = Cart.getForCheckout();
  const totale = Cart.total(); // EURO

  try {
    const res = await fetch("/api/paypal/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        prodotti,
        totale
      })
    });

    const data = await res.json();

    if (!data.success || !data.paypalUrl) {
      alert("Errore durante la creazione dell'ordine PayPal.");
      return;
    }

    // Redirect PayPal
    window.location.href = data.paypalUrl;

  } catch (err) {
    console.error("Errore pagamento:", err);
    alert("Errore durante il pagamento.");
  }
}
