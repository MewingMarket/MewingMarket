/* =========================================================
   TOP RECENSIONI — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [TOP-REC 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [TOP-REC 2058] pageInit() avviata");
  caricaTopRecensioni();
};

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
   CARICA TOP RECENSIONI (LOGICA ORIGINALE)
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
