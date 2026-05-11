/* =========================================================
   TOP RECENSIONI — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [TOP-REC] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [TOP-REC] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [TOP-REC] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [TOP-REC] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [TOP-REC] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [TOP-REC] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [TOP-REC] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [TOP-REC] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [TOP-REC] critical-ready già presente → avvio modulo");

  caricaTopRecensioni();
}

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiTopRecensioni(path, options = {}) {
  console.log("🌐 [TOP-REC] API:", path);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [TOP-REC] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [TOP-REC] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [TOP-REC] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   CARICA TOP RECENSIONI (TUO CODICE ORIGINALE)
========================================================= */
async function caricaTopRecensioni() {
  console.log("📥 [TOP-REC] Carico top recensioni…");

  const box = document.getElementById("topRecensioni");
  if (!box) {
    console.warn("❌ [TOP-REC] #topRecensioni NON trovato");
    return;
  }

  const data = await apiTopRecensioni("/api/recensioni/getTopRecensioni", {
    method: "GET"
  });

  console.log("📦 [TOP-REC] Risposta API:", data);

  if (!data || !data.top || data.top.length === 0) {
    box.innerHTML = "<p>Nessuna recensione disponibile.</p>";
    return;
  }

  box.innerHTML = data.top
    .map(r => `
      <div class="rec-card">
        <div class="rec-header">
          <span class="stelle">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          <span class="data">${new Date(r.data).toLocaleDateString("it-IT")}</span>
        </div>

        <p class="commento">${r.commento}</p>

        <p class="prodotto">
          <a href="/prodotto.html?id=${r.prodotto_id}">
            ${r.prodotto_titolo}
          </a>
        </p>
      </div>
    `)
    .join("");

  console.log("🟢 [TOP-REC] Render completato");
}
