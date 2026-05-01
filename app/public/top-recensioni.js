/* =========================================================
   TOP RECENSIONI — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", caricaTopRecensioni);

async function apiTopRecensioni(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
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

async function caricaTopRecensioni() {
  const box = document.getElementById("topRecensioni");
  if (!box) return;

  const data = await apiTopRecensioni("/api/recensioni/getTopRecensioni", {
    method: "GET"
  });

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
}
