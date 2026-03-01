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

  const prodEl = document.getElementById("prod");
  const priceEl = document.getElementById("price");
  const dateEl = document.getElementById("date");

  if (ordine.prodotti.length === 1) {
    prodEl.textContent = ordine.prodotti[0].titolo;
    priceEl.textContent = ordine.prodotti[0].prezzo;
  } else {
    prodEl.textContent = `${ordine.prodotti.length} prodotti`;
    priceEl.textContent = ordine.totale;
  }

  // PATCH: lista prodotti
  const listEl = document.getElementById("prod-list");
  listEl.innerHTML = ordine.prodotti
    .map(p => `<li>${p.titolo} — ${p.prezzo}€</li>`)
    .join("");

  dateEl.textContent = new Date().toLocaleDateString("it-IT");

  // PATCH: download se COMPLETED
  const dlBox = document.getElementById("download-box");
  if (ordine.stato === "COMPLETED") {
    dlBox.innerHTML = ordine.prodotti
      .map(p => `<a class="btn-download" href="/api/vendite/download/${p.slug}?token=${localStorage.getItem("session")}">Scarica ${p.titolo}</a>`)
      .join("<br>");
  }

  Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  document.getElementById("feedbackBtn").addEventListener("click", () => {
    window.location.href = `feedback.html?orderId=${orderId}`;
  });

  if (window.trackEvent) {
    trackEvent("order_completed", {
      orderId,
      totale: ordine.totale,
      prodotti: ordine.prodotti.length
    });
  }
});
