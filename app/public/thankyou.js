/* =========================================================
   THANK YOU PAGE — MewingMarket
   Versione Premium: verifica ordine, mostra riepilogo,
   svuota carrello, aggiorna badge, UX pulita
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* -----------------------------------------
     1) OTTIENI ORDER ID DALL'URL
  ----------------------------------------- */
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    window.location.href = "catalogo.html";
    return;
  }

  /* -----------------------------------------
     2) CHIAMA BACKEND PER VERIFICARE ORDINE
  ----------------------------------------- */
  let ordine;

  try {
    const res = await fetch(`/api/paypal/complete-order?orderId=${orderId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" }
    });

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

  /* -----------------------------------------
     3) POPOLA RIEPILOGO ORDINE
  ----------------------------------------- */
  const prodEl = document.getElementById("prod");
  const priceEl = document.getElementById("price");
  const dateEl = document.getElementById("date");

  // Se è un solo prodotto
  if (ordine.prodotti.length === 1) {
    prodEl.textContent = ordine.prodotti[0].titolo;
    priceEl.textContent = ordine.prodotti[0].prezzo;
  } else {
    // Multi prodotto
    prodEl.textContent = `${ordine.prodotti.length} prodotti`;
    priceEl.textContent = ordine.totale;
  }

  const now = new Date();
  dateEl.textContent = now.toLocaleDateString("it-IT");

  /* -----------------------------------------
     4) SVUOTA CARRELLO + AGGIORNA BADGE
  ----------------------------------------- */
  Cart.clear();

  if (typeof aggiornaBadgeCarrello === "function") {
    aggiornaBadgeCarrello();
  }

  /* -----------------------------------------
     5) PULSANTE RECENSIONE
  ----------------------------------------- */
  const feedbackBtn = document.getElementById("feedbackBtn");

  feedbackBtn.addEventListener("click", () => {
    window.location.href = `feedback.html?orderId=${orderId}`;
  });

  /* -----------------------------------------
     6) TRACKING EVENTO
  ----------------------------------------- */
  if (window.trackEvent) {
    trackEvent("order_completed", {
      orderId,
      totale: ordine.totale,
      prodotti: ordine.prodotti.length
    });
  }
});
