/**
 * =========================================================
 * File: dashboard-vendite.js
 * Dashboard vendite (frontend admin)
 * Versione 2026.60 — Compatibile con loader-admin
 * =========================================================
 */

document.addEventListener("admin-header-loaded", async () => {
  // Aspettiamo che header/footer/head siano caricati
  console.log("[ADMIN] Dashboard vendite: inizializzazione");

  try {
    const res = await fetch("/admin/analytics");
    const data = await res.json();

    if (!data.success) {
      console.error("[ADMIN] Errore analytics:", data.error);
      return;
    }

    popolaKPI(data.kpi);
    popolaTopProdotti(data.topProdotti);
    popolaUTM(data.utm);
    popolaGrafico(data.venditeGiornaliere);

  } catch (err) {
    console.error("[ADMIN] dashboard-vendite.js error:", err);
  }
});

/* =========================================================
   KPI PRINCIPALI
========================================================= */
function popolaKPI(kpi) {
  document.getElementById("kpi-vendite").textContent = kpi.venditeTotali;
  document.getElementById("kpi-revenue").textContent = formatEuro(kpi.revenueTotale);
  document.getElementById("kpi-prodotti").textContent = kpi.prodottiVenduti;
}

function formatEuro(cent) {
  return (cent / 100).toFixed(2) + " €";
}

/* =========================================================
   TOP PRODOTTI
========================================================= */
function popolaTopProdotti(lista) {
  const tbody = document.querySelector("#tabella-top-prodotti tbody");
  tbody.innerHTML = "";

  lista.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.titolo_breve}</td>
      <td>${p.vendite}</td>
      <td>${formatEuro(p.revenue)}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================================================
   PERFORMANCE UTM
========================================================= */
function popolaUTM(lista) {
  const tbody = document.querySelector("#tabella-utm tbody");
  tbody.innerHTML = "";

  lista.forEach(u => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${u.utm_source || "—"}</td>
      <td>${u.utm_medium || "—"}</td>
      <td>${u.utm_campaign || "—"}</td>
      <td>${u.vendite}</td>
    `;

    tbody.appendChild(tr);
  });
}

/* =========================================================
   GRAFICO VENDITE (Chart.js)
========================================================= */
function popolaGrafico(vendite) {
  const ctx = document.getElementById("grafico-vendite");

  if (!ctx) {
    console.error("[ADMIN] Canvas grafico non trovato");
    return;
  }

  const labels = vendite.map(v => v.data);
  const valori = vendite.map(v => v.totale);

  new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [{
        label: "Vendite giornaliere",
        data: valori,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.2)",
        borderWidth: 2,
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
