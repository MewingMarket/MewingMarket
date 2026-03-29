document.addEventListener("DOMContentLoaded", async () => {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  const box = document.querySelector("#cancel-message");

  if (!orderId) {
    if (box) box.textContent = "OrderId mancante.";
    return;
  }

  try {
    const res = await fetch(`/api/paypal/cancel-order?orderId=${orderId}`);
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
