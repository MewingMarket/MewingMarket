// =========================================================
// DASHBOARD ADMIN – versione blindata e coerente
// =========================================================

// Sanitizzazione
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";

// =========================================================
// CARICA STATISTICHE
// =========================================================

async function caricaStats() {
  try {
    const data = await adminFetch("/api/admin/stats");

    if (!data.success) return;

    document.getElementById("stat-vendite").textContent =
      clean(String(data.stats.venditeTotali));

    document.getElementById("stat-ordini").textContent =
      clean(String(data.stats.ordiniTotali));

    document.getElementById("stat-prodotti").textContent =
      clean(String(data.stats.prodottiAttivi));

  } catch (err) {
    console.error("Errore stats:", err);
  }
}

// =========================================================
// CARICA ULTIMI ORDINI
// =========================================================

async function caricaUltimiOrdini() {
  try {
    const data = await adminFetch("/api/admin/orders/latest");

    if (!data.success) return;

    const tbody = document.querySelector("#tabella-ultimi-ordini tbody");
    tbody.innerHTML = "";

    (data.ordini || []).forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(o.data)}</td>
        <td>${clean(o.prodotto)}</td>
        <td>${clean(String(o.prezzo))} €</td>
        <td>${clean(o.email)}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore ultimi ordini:", err);
  }
}

// =========================================================
// INIT
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  // Controllo token già gestito da loader-admin.js
  caricaStats();
  caricaUltimiOrdini();
});
