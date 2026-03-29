// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (2026.92)
// Fix: invio corretto a create-order (email + prodotti + totale)
// Fix: debug completo
// Fix: slug eliminato dal carrello
// =========================================================

console.log("[CHECKOUT] Caricato");

let authOk = false;
let cartOk = false;

// --------------------------------------------------------
// Attendi auth-ready
// --------------------------------------------------------
document.addEventListener("auth-ready", () => {
  authOk = true;
  tryStartCheckout();
});

// --------------------------------------------------------
// Attendi cart-ready
// --------------------------------------------------------
document.addEventListener("cart-ready", () => {
  cartOk = true;
  tryStartCheckout();
});

// --------------------------------------------------------
// Avvia checkout SOLO quando entrambi sono pronti
// --------------------------------------------------------
function tryStartCheckout() {
  if (authOk && cartOk) {
    console.log("[CHECKOUT] auth-ready + cart-ready → initCheckout()");
    initCheckout();
  }
}

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
    const res = await fetch("/api/utenti/me", {
      headers: { "Authorization": "Bearer " + token }
    });

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
  // 2) Carica carrello (ORA SICURO)
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
  // 5) Bottone acquista (PayPal fase 3)
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

      // 🔥 PATCH DEFINITIVA → invio corretto al backend
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({
          email: utenteEmail,
          prodotti: payload,
          totale: totaleEuro
        })
      });

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
