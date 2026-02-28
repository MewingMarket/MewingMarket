// =========================================================
// File: app/public/admin/js/dashboard-admin.js
// Dashboard Admin (nuovo sistema token)
// =========================================================

function getAdminToken() {
  return localStorage.getItem("admin_token");
}

async function adminFetch(url, options = {}) {
  const token = getAdminToken();

  const headers = Object.assign(
    {},
    options.headers || {},
    { "x-admin-token": token }
  );

  const res = await fetch(url, { ...options, headers });
  return res.json();
}

// ---------------------------------------------------------
// CARICA STATISTICHE
// ---------------------------------------------------------
async function caricaStats() {
  try {
    const data = await adminFetch("/api/admin/stats");

    if (!data.success) return;

    document.getElementById("stat-vendite").textContent = data.stats.venditeTotali;
    document.getElementById("stat-ordini").textContent = data.stats.ordiniTotali;
    document.getElementById("stat-prodotti").textContent = data.stats.prodottiAttivi;

  } catch (err) {
    console.error("Errore stats:", err);
  }
}

// ---------------------------------------------------------
// CARICA ULTIMI ORDINI
// ---------------------------------------------------------
async function caricaUltimiOrdini() {
  try {
    const data = await adminFetch("/api/admin/orders/latest");

    if (!data.success) return;

    const tbody = document.querySelector("#tabella-ultimi-ordini tbody");
    tbody.innerHTML = "";

    data.ordini.forEach(o => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${o.data}</td>
        <td>${o.prodotto}</td>
        <td>${o.prezzo} €</td>
        <td>${o.email}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore ultimi ordini:", err);
  }
}

// ---------------------------------------------------------
// AVVIO
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  const token = getAdminToken();
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  caricaStats();
  caricaUltimiOrdini();
});
