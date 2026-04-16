// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (PATCH 2027.300)
// - Usa fetchCritico globale + apiFetch alias
// - Nessuna regressione
// =========================================================

console.log("[CHECKOUT] Caricato");

let authOk = false;
let cartOk = false;

/* =========================================================
   EVENTI DI AVVIO
========================================================= */
document.addEventListener("auth-ready", () => {
  authOk = true;
  tryStartCheckout();
});

document.addEventListener("cart-ready", () => {
  cartOk = true;
  tryStartCheckout();
});

function tryStartCheckout() {
  if (authOk && cartOk) {
    console.log("[CHECKOUT] auth-ready + cart-ready → initCheckout()");
    initCheckout();
  }
}

/* =========================================================
   INIT CHECKOUT
========================================================= */
async function initCheckout() {
  console.log("[CHECKOUT] initCheckout()");

  // -------------------------------------------------------
  // 1) Verifica login tramite /me
  // -------------------------------------------------------
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("[CHECKOUT] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  let utenteEmail = null;

  try {
    // ⭐ PATCH 2027.300 — usa fetchCritico globale
    const res = await window.fetchCritico(
      "/utenti/me",
      {
        headers: { "Authorization": "Bearer " + token }
      },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json();

    if (!data.success) {
      console.warn("[CHECKOUT] Sessione non valida → redirect login");
      window.location.href = "login.html";
      return;
    }

    utenteEmail = data.utente.email;
    console.log("[CHECKOUT] Utente verificato:", utenteEmail);

  } catch (err) {
    console.error("[CHECKOUT] Errore verifica sessione:", err);
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // -------------------------------------------------------
  // 2) Carica carrello
  // -------------------------------------------------------
  const cart = Cart.get();

  console.log("[CHECKOUT] Cart.get() →", cart);

  if (!Array.isArray(cart) || cart.length === 0) {
    console.warn("[CHECKOUT] Carrello vuoto → redirect catalogo");
    window.location.href = "catalogo.html";
    return;
  }

  // -------------------------------------------------------
  // 3) Rendering prodotti
  // -------------------------------------------------------
  const container = document.getElementById("checkout-container");
  container.innerHTML = cart.map(item => {
    const prezzo = (item.prezzo_cent / 100).toFixed(2);
    const subtotal = ((item.prezzo_cent * item.qty) / 100).toFixed(2);

    return `
      <div class="checkout-item">
        <img src="${item.immagine}" alt="${item.titolo}">
        <div class="info">
          <h3>${item.titolo}</h3>
          <p>Prezzo: €${prezzo}</p>
          <p>Quantità: ${item.qty}</p>
          <p>Subtotale: €${subtotal}</p>
        </div>
      </div>
    `;
  }).join("");

  // -------------------------------------------------------
  // 4) Calcolo totale
  // -------------------------------------------------------
  let totaleCent = 0;

  cart.forEach((item) => {
    totaleCent += item.prezzo_cent * item.qty;
  });

  const totaleEuro = (totaleCent / 100).toFixed(2);

  const elTotale = document.getElementById("totale");
  const elDaPagare = document.getElementById("da-pagare");

  if (elTotale) elTotale.textContent = totaleEuro;
  if (elDaPagare) elDaPagare.textContent = totaleEuro;

  console.log("[CHECKOUT] Totale:", totaleEuro);

  // -------------------------------------------------------
  // 5) Bottone acquista (PayPal)
  // -------------------------------------------------------
  const btn = document.getElementById("btnCheckout");
  if (!btn) return;

  btn.onclick = async () => {

    try {
      console.log("[CHECKOUT] Creazione ordine PayPal…");

      // 🔥 DEBUG COMPLETO PRIMA DELLA FETCH
      console.log("======================================");
      console.log("[CHECKOUT] DEBUG PRIMA DELLA FETCH");
      console.log("Email:", utenteEmail);
      console.log("Token:", localStorage.getItem("token"));
      console.log("SessionState:", localStorage.getItem("sessionState"));
      console.log("isLogged:", window.isLogged);
      console.log("Cart.get():", Cart.get());
      console.log("Cart.getForCheckout():", Cart.getForCheckout());
      console.log("Totale:", totaleEuro);
      console.log("======================================");

      const payload = Cart.getForCheckout();

      // ⭐ PATCH 2027.300 — usa fetchCritico globale
      const res = await window.fetchCritico(
        "/paypal/create-order",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: utenteEmail,
            prodotti: payload,
            totale: totaleEuro
          })
        },
        { retries: 3, backoffMs: 400 }
      );

      const data = await res.json().catch(() => ({}));
      console.log("[CHECKOUT] Risposta create-order:", data);

      if (!data.success || !data.paypalUrl) {
        alert("Errore nella creazione dell'ordine.");
        return;
      }

      window.location.href = data.paypalUrl;

    } catch (err) {
      console.error("[CHECKOUT] Errore:", err);
      alert("Errore di connessione.");
    }
  };
}
