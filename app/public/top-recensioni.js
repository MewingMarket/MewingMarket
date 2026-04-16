/* =========================================================
   TOP RECENSIONI — Versione 2027.300
   - Usa fetchCritico globale + API alias
   - Nessuna regressione
========================================================= */

document.addEventListener("DOMContentLoaded", caricaTopRecensioni);

async function caricaTopRecensioni() {
  const box = document.getElementById("topRecensioni");

  try {
    // ⭐ PATCH 2027.300 — alias + fetchCritico globale
    const res = await window.fetchCritico(
      "/recensioni/top",
      { method: "GET" }
    );

    const data = await res.json();

    if (!data.success || data.top.length === 0) {
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

  } catch (err) {
    console.error("Errore top recensioni:", err);
    box.innerHTML = "<p>Errore nel caricamento.</p>";
  }
}
