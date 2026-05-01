/* =========================================================
   CANCEL ORDER — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", async () => {
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  const box = document.querySelector("#cancel-message");

  if (!orderId) {
    if (box) box.textContent = "OrderId mancante.";
    return;
  }

  const data = await apiCancelOrder(`/api/paypal/paypalCancelOrder?orderId=${orderId}`);

  if (!box) return;

  if (!data) {
    box.textContent = "Errore durante l'annullamento.";
    return;
  }

  box.textContent = data.message || "Ordine annullato correttamente.";
});

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiCancelOrder(path) {
  let res;
  try {
    res = await fetch(path, { method: "GET" });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
