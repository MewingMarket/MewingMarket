// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (PATCH 2027.400)
// - Usa fetchUniversale (fallback chain)
// - Sincronizzazione Totale Centesimi per PayPal
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

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[CHECKOUT] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  let utenteEmail = null;

  try {
    const res = await window.fetchUniversale(
      "/utenti/me",
      { headers: { "Authorization": "Bearer " + token } },
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
  if (!Array.isArray(cart) || cart.length === 0) {
    console.warn("[CHECKOUT] Carrello vuoto → redirect catalogo");
    window.location.href = "catalogo.html";
    return;
  }

  // -------------------------------------------------------
  // 3) Rendering prodotti e calcolo Totale
  // -------------------------------------------------------
  const container = document.getElementById("checkout-container");
  let totaleCent = 0;

  if (container) {
    container.innerHTML = cart.map(item => {
      const pc = Number(item.prezzo_cent) || 0;
      const q = Number(item.qty) || 1;
      totaleCent += (pc * q);

      const prezzo = (pc / 100).toFixed(2);
      const subtotal = ((pc * q) / 100).toFixed(2);

      return `
        <div class="checkout-item">
          <img src="${item.immagine || '/placeholder.webp'}" alt="${item.titolo}">
          <div class="info">
            <h3>${item.titolo}</h3>
            <p>Prezzo: €${prezzo}</p>
            <p>Quantità: ${q}</p>
            <p>Subtotale: <strong>€${subtotal}</strong></p>
          </div>
        </div>
      `;
    }).join("");
  }

  const totaleEuro = (totaleCent / 100).toFixed(2);
  const elTotale = document.getElementById("totale");
  const elDaPagare = document.getElementById("da-pagare");

  if (elTotale) elTotale.textContent = totaleEuro;
  if (elDaPagare) elDaPagare.textContent = totaleEuro;

  console.log("[CHECKOUT] Totale Calcolato:", totaleEuro);

  // -------------------------------------------------------
  // 4) Bottone acquista (PayPal)
  // -------------------------------------------------------
  const btn = document.getElementById("btnCheckout");
  if (!btn) return;

  btn.onclick = async () => {
    try {
      btn.disabled = true;
      btn.textContent = "Reindirizzamento...";
      
      console.log("[CHECKOUT] Creazione ordine PayPal per:", utenteEmail);

      const payload = Cart.getForCheckout();

      const res = await window.fetchUniversale(
        "/paypal/create-order",
        {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({
            email: utenteEmail,
            prodotti: payload,
            totale: totaleEuro // Inviamo il totale come stringa "XX.XX" per PayPal
          })
        },
        { retries: 3, backoffMs: 400 }
      );

      const data = await res.json().catch(() => ({}));

      if (data.success && data.paypalUrl) {
        window.location.href = data.paypalUrl;
      } else {
        btn.disabled = false;
        btn.textContent = "Acquista ora";
        alert("Errore PayPal: " + (data.error || "Impossibile creare l'ordine."));
      }

    } catch (err) {
      console.error("[CHECKOUT] Errore critico:", err);
      btn.disabled = false;
      btn.textContent = "Acquista ora";
      alert("Errore di connessione. Riprova tra poco.");
    }
  };
}
