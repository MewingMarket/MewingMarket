// =========================================================
// CHECKOUT PREMIUM – MewingMarket (SQL READY)
// Versione definitiva: login check + multi/single + qty + totale + ordini SQL
// =========================================================

/* =========================================================
   1) LOGIN CHECK
========================================================= */
document.addEventListener("DOMContentLoaded", () => {
  if (!isLogged()) {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("slug");

    const redirectURL = slug
      ? `login.html?redirect=checkout.html?slug=${slug}`
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

  document.getElementById("checkout-container").innerHTML = `
    <h2>Checkout — Acquisto Singolo</h2>

    <div class="checkout-item">
      <img src="${prodotto.immagine}" alt="${prodotto.titolo}">
      <div>
        <h3>${prodotto.titolo}</h3>
        <p>Prezzo: €${prodotto.prezzo}</p>
      </div>
    </div>

    <div class="checkout-totale">
      <h3>Totale: €${prodotto.prezzo}</h3>
    </div>

    <button id="btn-paga" class="btn-primario">Paga ora</button>
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
    html += `
      <div class="checkout-item" data-slug="${p.slug}">
        <img src="${p.immagine}" alt="${p.titolo}">
        <div class="info">
          <h3>${p.titolo}</h3>
          <p>Prezzo: €${p.prezzo}</p>

          <div class="qty-box">
            <button class="qty-minus" data-slug="${p.slug}">-</button>
            <span class="qty">${p.qty}</span>
            <button class="qty-plus" data-slug="${p.slug}">+</button>
          </div>
        </div>

        <button class="btn-remove" data-slug="${p.slug}">Rimuovi</button>
      </div>
    `;
  });

  html += `</div>`;

  html += `
    <div class="checkout-totale">
      <h3>Totale: €${Cart.total()}</h3>
    </div>

    <button id="btn-paga" class="btn-primario">Paga ora</button>
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
      Cart.updateQty(btn.dataset.slug, +1);
      renderMultiCheckout();
    });
  });

  document.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      Cart.updateQty(btn.dataset.slug, -1);
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
      Cart.remove(btn.dataset.slug);
      renderMultiCheckout();
      aggiornaBadgeCarrello();
    });
  });
}

/* =========================================================
   7) PAGAMENTO (SQL + API ORDINI)
========================================================= */
async function pagaOrdine(items) {
  if (!items || !items.length) {
    alert("Nessun prodotto da acquistare.");
    return;
  }

  const email = getUserEmail(); // funzione già esistente nel tuo sistema
  const prodotti = Cart.getForCheckout();
  const totale = Cart.total();

  try {
    const res = await fetch("/api/ordini/crea", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        prodotti,
        totale,
        metodo: "PayPal"
      })
    });

    const data = await res.json();

    if (!data.success) {
      alert("Errore durante la creazione dell'ordine.");
      return;
    }

    // Ordine salvato correttamente
    Cart.clear();
    aggiornaBadgeCarrello();

    window.location.href = "thankyou.html";

  } catch (err) {
    console.error("Errore pagamento:", err);
    alert("Errore durante il pagamento.");
  }
}
