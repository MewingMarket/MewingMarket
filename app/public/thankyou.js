/* =========================================================
   FILE: /public/thankyou.js
   THANK YOU PAGE — MewingMarket
   Versione SQL READY + PayPal + Download sicuro
   PATCH 2026 — Flusso recensioni post-acquisto
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
  ========================================================== */
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
     2) RENDER RIEPILOGO (SQL READY)
  ========================================================== */
  const prodEl = document.getElementById("prod");
  const priceEl = document.getElementById("price");
  const dateEl = document.getElementById("date");

  if (ordine.prodotti.length === 1) {
    const p = ordine.prodotti[0];
    const prezzo = (p.prezzo_cent / 100) * (p.qty || 1);
    prodEl.textContent = p.titolo;
    priceEl.textContent = prezzo.toFixed(2);
  } else {
    prodEl.textContent = `${ordine.prodotti.length} prodotti`;
    priceEl.textContent = (ordine.totale_cent / 100).toFixed(2);
  }

  // Lista prodotti
  const listEl = document.getElementById("prod-list");
  listEl.innerHTML = ordine.prodotti
    .map(p => {
      const prezzo = (p.prezzo_cent / 100) * (p.qty || 1);
      return `<li>${p.titolo} — ${prezzo.toFixed(2)}€</li>`;
    })
    .join("");

  dateEl.textContent = new Date().toLocaleDateString("it-IT");

  /* =========================================================
     3) DOWNLOAD (ID-based + token)
  ========================================================== */
  const dlBox = document.getElementById("download-box");
  const session = localStorage.getItem("session");

  if (ordine.stato === "completato") {
    dlBox.innerHTML = ordine.prodotti
      .map(p => `
        <a class="btn-download" 
           href="/api/vendite/download/${p.prodotto_id}?session=${session}">
          Scarica ${p.titolo}
        </a>
      `)
      .join("<br>");
  } else {
    dlBox.innerHTML = `<p>L'ordine non risulta completato.</p>`;
  }

  /* =========================================================
     4) SVUOTA CARRELLO + BADGE
  ========================================================== */
  Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  /* =========================================================
     5) PATCH RECENSIONI — Flusso post-acquisto
  ========================================================== */
  const fbBtn = document.getElementById("feedbackBtn");

  if (fbBtn && ordine.prodotti.length > 0) {
    fbBtn.style.display = "inline-block";

    fbBtn.addEventListener("click", () => {
      // Passiamo i prodotti acquistati alla pagina recensioni
      const slugs = ordine.prodotti.map(p => p.slug).join(",");
      window.location.href = `recensioni.html?from=order&prodotti=${slugs}`;
    });
  }

  /* =========================================================
     6) TRACKING EVENTO
  ========================================================== */
  if (window.trackEvent) {
    trackEvent("order_completed", {
      orderId,
      totale: ordine.totale_cent / 100,
      prodotti: ordine.prodotti.length
    });
  }
});
