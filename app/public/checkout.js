// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA (2026)
// Sincronizzato con auth-ready + token + Cart
// =========================================================

console.log("[CHECKOUT] Caricato");

// Attende auth-ready PRIMA di iniziare
document.addEventListener("auth-ready", initCheckout);

function initCheckout() {
  console.log("[CHECKOUT] initCheckout()");

  // -------------------------------------------------------
  // 1) Verifica login
  // -------------------------------------------------------
  if (!window.isLogged) {
    console.warn("[CHECKOUT] Utente non loggato → redirect login");
    window.location.href = "login.html";
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[CHECKOUT] Nessun token → redirect login");
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
  // 3) Calcolo totale
  // -------------------------------------------------------
  let totaleCent = 0;

  cart.forEach((item) => {
    const prezzo = Number(item.prezzo_cent) || 0;
    const qty = Number(item.qty) || 1;
    totaleCent += prezzo * qty;
  });

  const totaleEuro = (totaleCent / 100).toFixed(2);

  const elTotale = document.getElementById("totale");
  const elDaPagare = document.getElementById("da-pagare");

  if (elTotale) elTotale.textContent = totaleEuro;
  if (elDaPagare) elDaPagare.textContent = totaleEuro;

  console.log("[CHECKOUT] Totale:", totaleEuro);

  // -------------------------------------------------------
  // 4) Bottone acquista
  // -------------------------------------------------------
  const btn = document.getElementById("btnCheckout");
  if (!btn) return;

  btn.onclick = async () => {
    btn.disabled = true;

    try {
      console.log("[CHECKOUT] Creazione ordine PayPal…");

      const payload = (typeof Cart !== "undefined")
        ? Cart.getForCheckout()
        : [];

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
