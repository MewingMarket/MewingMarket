/* =========================================================
   CANCEL ORDER — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [CANCEL-ORDER] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [CANCEL-ORDER] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [CANCEL-ORDER] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [CANCEL-ORDER] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [CANCEL-ORDER] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [CANCEL-ORDER] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [CANCEL-ORDER] initPage() eseguita");

  // Se critical-ready non è ancora arrivato, aspettiamo
  if (!window.__criticalReady) {
    console.log("⏳ [CANCEL-ORDER] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [CANCEL-ORDER] critical-ready già presente → avvio pagina");

  avviaCancelOrder();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
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
