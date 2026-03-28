// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (2026.80)
// Compatibile con auth-ready + Cart SQL-ready + /me
// =========================================================

console.log("[CHECKOUT] Caricato");

// Attende auth-ready PRIMA di iniziare
document.addEventListener("auth-ready", initCheckout);

async function initCheckout() {
  console.log("[CHECKOUT] initCheckout()");

  // -------------------------------------------------------
  // 1) Verifica login tramite /me (fonte di verità)
  // -------------------------------------------------------
  const token = localStorage.getItem("token");

  if (!token) {
    console.warn("[CHECKOUT] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

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

    console.log("[CHECKOUT] Utente verificato:", data.utente.email);

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
  const cart = (typeof Cart !== "undefined") ? Cart.get() : [];

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
    btn.disabled = true;

    try {
      console.log("[CHECKOUT] Creazione ordine PayPal…");

      const payload = Cart.getForCheckout();

      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ carrello: payload })
      });

      const data = await res.json().catch(() => ({}));
      console.log("[CHECKOUT] Risposta create-order:", data);

      if (!data.success || !data.id) {
        alert("Errore nella creazione dell'ordine.");
        btn.disabled = false;
        return;
      }

      // Redirect PayPal
      window.location.href = data.approvalUrl;

    } catch (err) {
      console.error("[CHECKOUT] Errore:", err);
      alert("Errore di connessione.");
    } finally {
      btn.disabled = false;
    }
  };
}
