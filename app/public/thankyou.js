/* =========================================================
   THANK YOU PAGE — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", async () => {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    window.location.href = "catalogo.html";
    return;
  }

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiThankyou(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     1) VERIFICA ORDINE
  ========================================================== */
  const data = await apiThankyou(`/api/paypal/paypalCompleteOrder?orderId=${orderId}`, {
    method: "GET"
  });

  if (!data || !data.order) {
    document.querySelector(".box").innerHTML = `
      <h1>Ordine non valido</h1>
      <p>Impossibile verificare l'ordine.</p>
      <a href="catalogo.html" class="btn btn-home">Torna al catalogo</a>
    `;
    return;
  }

  const ordine = data.order;

  /* =========================================================
     2) RENDER RIEPILOGO
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

  const listEl = document.getElementById("prod-list");
  listEl.innerHTML = ordine.prodotti
    .map(p => {
      const prezzo = (p.prezzo_cent / 100) * (p.qty || 1);
      return `<li>${p.titolo} — ${prezzo.toFixed(2)}€</li>`;
    })
    .join("");

  dateEl.textContent = new Date().toLocaleDateString("it-IT");

  /* =========================================================
     3) SVUOTA CARRELLO
  ========================================================== */
  if (window.Cart?.clear) Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  /* =========================================================
     4) TRACKING EVENTO
  ========================================================== */
  window.trackEvent?.("order_completed", {
    orderId,
    totale: ordine.totale_cent / 100,
    prodotti: ordine.prodotti.length
  });
});
