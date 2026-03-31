/**
 * =========================================================
 * File: dashboard-vendite.js
 * Dashboard vendite (frontend admin)
 * Versione 2026.90 — Con adminFetch + protezione admin
 * =========================================================
 */

/* =========================================================
   adminFetch — identico a dashboard-admin.js
========================================================= */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const ruolo = localStorage.getItem("ruolo");

  // Protezione admin
  if (!token || ruolo !== "admin") {
    console.warn("[ADMIN] Accesso negato → non admin");
    window.location.href = "/login.html?redirect=admin/dashboard-admin-vendite.html";
    return;
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("[ADMIN] Token non valido → logout");

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");

    window.location.href = "/login.html";
    return;
  }

  return res;
}

/* =========================================================
   INIT — Avvio dopo header admin
========================================================= */
document.addEventListener("admin-header-loaded", async () => {
  console.log("[ADMIN] Dashboard vendite: inizializzazione");

  try {
    // PATCH: endpoint corretto → /api/admin/analytics
    const res = await adminFetch("/api/admin/analytics");

    if (!res) return; // adminFetch ha già gestito redirect

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
