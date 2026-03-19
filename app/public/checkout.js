// =========================================================
// CHECKOUT.JS — Versione DEFINITIVA
// Sincronizzato con auth-ready + carrello + SQL
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

  // -------------------------------------------------------
  // 2) Carica carrello
  // -------------------------------------------------------
  const cart = JSON.parse(localStorage.getItem("carrello") || "[]");

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
    totaleCent += prezzo;
  });

  const totaleEuro = (totaleCent / 100).toFixed(2);

  const totalEl = document.getElementById("checkout-total");
  if (totalEl) {
    totalEl.textContent = "€" + totaleEuro;
  }

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

      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrello: cart })
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
