// =========================================================
// THANKYOU — riepilogo ordine + svuota carrello + feedback
// =========================================================

document.addEventListener("DOMContentLoaded", () => {

  // 1) LEGGI PARAMETRI DALLA URL
  const params = new URLSearchParams(location.search);
  const product = params.get("product") || "Prodotto digitale";
  const price = params.get("price") || "0";
  const slug = params.get("slug") || "";

  // 2) POPOLA RIEPILOGO
  document.getElementById("prod").textContent = product;
  document.getElementById("price").textContent = price;
  document.getElementById("date").textContent = new Date().toLocaleString("it-IT");

  // 3) SVUOTA CARRELLO
  if (window.Cart) Cart.clear();

  // 4) TRACKING (solo frontend)
  if (window.trackEvent) {
    trackEvent("purchase_complete", {
      product,
      price,
      slug
    });
  }

  // 5) FEEDBACK
  document.getElementById("feedbackBtn").onclick = () => {
    location.href = "/recensione.html?product=" + encodeURIComponent(product);
  };
});
