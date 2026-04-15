// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (2026.92)
// Fix: invio corretto a create-order (email + prodotti + totale)
// Fix: debug completo
// Fix: slug eliminato dal carrello (ID-based)
// Patch 2026.999 — fetchCritico + anti-HTML + anti-502
// =========================================================

console.log("[CHECKOUT] Caricato");

let authOk = false;
let cartOk = false;

/* =========================================================
   fetchCritico — retry + anti-HTML + anti-502
========================================================= */
async function fetchCritico(url, options = {}, cfg = {}) {
  const { retries = 3, backoff = 400 } = cfg;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      const ct = res.headers.get("content-type") || "";

      // Anti-HTML
      if (ct.includes("text/html")) {
        const html = await res.text();
        throw new Error("HTML inatteso: " + html.slice(0, 200));
      }

      // Retry su 502/503/504
      if (!res.ok) {
        if ([502, 503, 504].includes(res.status) && attempt < retries) {
          await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
          attempt++;
          continue;
        }
        throw new Error("HTTP " + res.status);
      }

      return res;

    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
      attempt++;
    }
  }
}

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
    // ⭐ PATCH: fetchCritico
    const res = await fetchCritico("/api/utenti/me", {
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

      // ⭐ PATCH: fetchCritico anche qui
      const res = await fetchCritico(
        "/api/paypal/create-order",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: utenteEmail,
            prodotti: payload,
            totale: totaleEuro
          })
        },
        { retries: 3, backoff: 400 }
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
