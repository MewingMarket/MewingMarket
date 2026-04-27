/* =========================================================
   TOP RECENSIONI — Versione 2027.900
   - critical-ready
   - fetch standard
   - Endpoint Java‑mode
========================================================= */

document.addEventListener("critical-ready", caricaTopRecensioni);

async function caricaTopRecensioni() {
  const box = document.getElementById("topRecensioni");

  try {
    // ⭐ PATCH — fetch nativo + endpoint aggiornato
    const res = await fetch("/api/recensioni/getTopRecensioni", {
      method: "GET"
    });

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
