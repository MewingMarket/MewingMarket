/* =========================================================
   CANCEL ORDER — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [CANCEL-ORDER 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [CANCEL-ORDER 2058] pageInit() avviata");
  avviaCancelOrder();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
========================================================= */
async function avviaCancelOrder() {
  console.log("🔥 cancel-order.js READY");

  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  console.log("🔍 [CANCEL-ORDER] orderId:", orderId);

  const box = document.querySelector("#cancel-message");

  if (!orderId) {
    console.warn("⚠️ [CANCEL-ORDER] OrderId mancante");
    if (box) box.textContent = "OrderId mancante.";
    return;
  }

  console.log("🌐 [CANCEL-ORDER] Chiamo API annullamento…");

  const data = await apiCancelOrder(`/api/paypal/paypalCancelOrder?orderId=${orderId}`);

  console.log("📦 [CANCEL-ORDER] Risposta API:", data);

  if (!box) {
    console.warn("⚠️ [CANCEL-ORDER] #cancel-message NON trovato");
    return;
  }

  if (!data) {
    box.textContent = "Errore durante l'annullamento.";
    return;
  }

  box.textContent = data.message || "Ordine annullato correttamente.";
}

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiCancelOrder(path) {
  console.log("➡️ [CANCEL-ORDER] API GET:", path);

  let res;
  try {
    res = await fetch(path, { method: "GET" });
  } catch (err) {
    console.error("❌ [CANCEL-ORDER] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [CANCEL-ORDER] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [CANCEL-ORDER] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
