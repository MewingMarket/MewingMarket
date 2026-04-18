/* =========================================================
   CANCEL ORDER — Frontend
   Versione 2027.300 — PATCH fetchCritico + API UNIVERSALE
   + Avvio sincronizzato con critical-ready
========================================================= */

document.addEventListener("critical-ready", async () => {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  const box = document.querySelector("#cancel-message");

  if (!orderId) {
    if (box) box.textContent = "OrderId mancante.";
    return;
  }

  try {
    // ⭐ PATCH 2027.300 — usa fetchCritico globale + alias API
    const res = await window.fetchCritico(
      `/paypal/cancel-order?orderId=${orderId}`,
      { method: "GET" },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json();

    if (box) {
      if (data.success) {
        box.textContent = data.message || "Ordine annullato correttamente.";
      } else {
        box.textContent = data.error || "Errore durante l'annullamento.";
      }
    }

  } catch (err) {
    console.error("Errore annullo ordine:", err);
    if (box) box.textContent = "Errore di connessione.";
  }
});
