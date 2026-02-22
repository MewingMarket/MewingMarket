document.addEventListener("DOMContentLoaded", async () => {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) return;

  try {
    await fetch(`/api/paypal/cancel-order?orderId=${orderId}`);
  } catch (err) {
    console.error("Errore annullo ordine:", err);
  }
});
