/* =========================================================
   FILE: /public/thankyou.js
   THANK YOU PAGE — MewingMarket
   Versione Premium: verifica ordine, mostra riepilogo,
   svuota carrello, aggiorna badge, UX pulita
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    window.location.href = "catalogo.html";
    return;
  }

  let ordine;

  /* =========================================================
     1) VERIFICA ORDINE (complete-order)
  ========================================================= */
  try {
    const res = await fetch(`/api/paypal/complete-order?orderId=${orderId}`);
    const data = await res.json();

    if (!data.success) {
      document.querySelector(".box").innerHTML = `
        <h1>Ordine non valido</h1>
        <p>${data.error || "Impossibile verificare l'ordine."}</p>
        <a href="catalogo.html" class="btn btn-home">Torna al catalogo</a>
      `;
      return;
    }

    ordine = data.order;

  } catch (err) {
    console.error(err);
    document.querySelector(".box").innerHTML = `
      <h1>Errore</h1>
      <p>Impossibile verificare l'ordine.</p>
      <a href="catalogo.html" class="btn btn-home">Torna al catalogo</a>
    `;
    return;
  }

  /* =========================================================
     2) RENDER RIEPILOGO
  ========================================================= */
  const prodEl = document.getElementById("prod");
  const priceEl = document.getElementById("price");
  const dateEl = document.getElementById("date");

  if (ordine.prodotti.length === 1) {
    const p = ordine.prodotti[0];
    prodEl.textContent = p.titolo;
    priceEl.textContent = (p.prezzo * (p.qty || 1)).toFixed(2);
  } else {
    prodEl.textContent = `${ordine.prodotti.length} prodotti`;
    priceEl.textContent = ordine.totale;
  }

  // Lista prodotti
  const listEl = document.getElementById("prod-list");
  listEl.innerHTML = ordine.prodotti
    .map(p => `<li>${p.titolo} — ${(p.prezzo * (p.qty || 1)).toFixed(2)}€</li>`)
    .join("");

  dateEl.textContent = new Date().toLocaleDateString("it-IT");

  /* =========================================================
     3) DOWNLOAD (solo se completato)
     Backend usa "completato", NON "COMPLETED"
  ========================================================= */
  const dlBox = document.getElementById("download-box");

  if (ordine.stato === "completato") {
    dlBox.innerHTML = ordine.prodotti
      .map(p => `
        <a class="btn-download" href="/api/vendite/download/${p.slug}">
          Scarica ${p.titolo}
        </a>
      `)
      .join("<br>");
  } else {
    dlBox.innerHTML = `<p>L'ordine non risulta completato.</p>`;
  }

  /* =========================================================
     4) SVUOTA CARRELLO + BADGE
  ========================================================= */
  Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  /* =========================================================
     5) FEEDBACK
  ========================================================= */
  const fbBtn = document.getElementById("feedbackBtn");
  if (fbBtn) {
    fbBtn.addEventListener("click", () => {
      window.location.href = `feedback.html?orderId=${orderId}`;
    });
  }

  /* =========================================================
     6) TRACKING EVENTO
  ========================================================= */
  if (window.trackEvent) {
    trackEvent("order_completed", {
      orderId,
      totale: ordine.totale,
      prodotti: ordine.prodotti.length
    });
  }
});
