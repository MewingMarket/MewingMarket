// =========================================================
// CHECKOUT PREMIUM – MewingMarket
// Versione definitiva: login check + single/multi + qty + totale
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
      const slug = btn.dataset.slug;
      const items = Cart.get();
      const p = items.find((x) => x.slug === slug);
      if (!p) return;

      p.qty++;
      Cart.save(items);
      renderMultiCheckout();
    });
  });

  document.querySelectorAll(".qty-minus").forEach((btn) => {
    btn.addEventListener("click", () => {
      const slug = btn.dataset.slug;
      const items = Cart.get();
      const p = items.find((x) => x.slug === slug);
      if (!p) return;

      p.qty = Math.max(1, p.qty - 1);
      Cart.save(items);
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
      const slug = btn.dataset.slug;
      Cart.remove(slug);
      renderMultiCheckout();
      aggiornaBadgeCarrello();
    });
  });
}

/* =========================================================
   7) PAGAMENTO (FAKE / API READY)
========================================================= */
function pagaOrdine(items) {
  if (!items || !items.length) {
    alert("Nessun prodotto da acquistare.");
    return;
  }

  // Qui integrerai PayPal / Stripe / API backend
  alert("Ordine completato! Riceverai una email con i dettagli.");

  Cart.clear();
  aggiornaBadgeCarrello();

  // PATCH: redirect corretto
  window.location.href = "thankyou.html";
}
