/* =========================================================
   THANK YOU PAGE — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [THANKYOU 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [THANKYOU 2058] pageInit() avviata");
  avviaThankyou();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
========================================================= */
async function avviaThankyou() {
  console.log("🔥 thankyou.js READY");

  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    console.warn("❌ [THANKYOU] orderId mancante → redirect catalogo");
    window.location.href = "catalogo.html";
    return;
  }

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiThankyou(path, options = {}) {
    console.log("🌐 [THANKYOU] API:", path);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ [THANKYOU] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [THANKYOU] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [THANKYOU] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     1) VERIFICA ORDINE
  ========================================================== */
  console.log("📥 [THANKYOU] Verifico ordine:", orderId);

  const data = await apiThankyou(`/api/paypal/paypalCompleteOrder?orderId=${orderId}`, {
    method: "GET"
  });

  console.log("📦 [THANKYOU] Risposta ordine:", data);

  if (!data || !data.order) {
    console.warn("❌ [THANKYOU] Ordine non valido");

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
  console.log("📝 [THANKYOU] Render riepilogo ordine");

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
  console.log("🛒 [THANKYOU] Svuoto carrello");

  if (window.Cart?.clear) Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  /* =========================================================
     4) TRACKING EVENTO
  ========================================================== */
  console.log("📊 [THANKYOU] Tracking evento order_completed");

  window.trackEvent?.("order_completed", {
    orderId,
    totale: ordine.totale_cent / 100,
    prodotti: ordine.prodotti.length
  });
}
