/* =========================================================
   CANCEL ORDER — Frontend
   Versione 2027.900 — API UNIVERSALE + CRITICAL READY
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
    // ⭐ PATCH 2027 — Nuovo endpoint Java‑mode
    const res = await fetch(`/api/paypal/paypalCancelOrder?orderId=${orderId}`, {
      method: "GET"
    });

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
