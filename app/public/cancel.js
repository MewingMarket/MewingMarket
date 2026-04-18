/* =========================================================
   CANCEL ORDER — Frontend
   Versione 2027.400 — FETCH UNIVERSALE + CRITICAL READY
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
    // ⭐ PATCH — usa fetchUniversale
    const res = await window.fetchUniversale(
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
