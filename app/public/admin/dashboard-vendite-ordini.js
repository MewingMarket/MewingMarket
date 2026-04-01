// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Versione 2026.97 — SQL LIVE (senza grafico)
// =========================================================

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  if (!token || sessionState !== "1") {
    alert("Sessione scaduta. Effettua di nuovo il login.");
    location.href = "/admin/login.html";
    return;
  }

  try {
    const res = await fetch("/api/admin/dashboard", {
      headers: { Authorization: "Bearer " + token }
    });

    const data = await res.json();

    if (!data.success) {
      alert("Errore: " + (data.error || "Accesso negato"));
      return;
    }

    renderKPI(data);
    // renderVendite30(data.vendite.vendite30);  // RIMOSSO
    renderTopProdotti(data.vendite.topProdotti);
    renderUTM(data.vendite.utm);
    renderOrdini(data.ordini.lista);

  } catch (err) {
    console.error("❌ Errore dashboard:", err);
    alert("Errore di connessione.");
  }
});

// =========================================================
// KPI
// =========================================================
function renderKPI(data) {
  document.getElementById("kpi-vendite").textContent = data.vendite.kpi.venditeTotali;
  document.getElementById("kpi-revenue").textContent = data.vendite.kpi.revenueTotale + "€";
  document.getElementById("kpi-prodotti").textContent = data.vendite.kpi.prodottiVenduti;

  document.getElementById("kpi-ordini").textContent = data.ordini.kpi.totali;
  document.getElementById("kpi-ordini-completati").textContent = data.ordini.kpi.completati;
  document.getElementById("kpi-ordini-annullati").textContent = data.ordini.kpi.annullati;
}

// =========================================================
// Top prodotti
// =========================================================
function renderTopProdotti(arr) {
  const body = document.getElementById("top-prodotti-body");
  body.innerHTML = "";

  arr.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.prodotto_id}</td>
      <td>${p.vendite}</td>
      <td>${(p.revenue / 100).toFixed(2)}€</td>
    `;
    body.appendChild(tr);
  });
}

// =========================================================
// UTM
// =========================================================
function renderUTM(arr) {
  const body = document.getElementById("utm-body");
  body.innerHTML = "";

  arr.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.source || "-"}</td>
      <td>${u.medium || "-"}</td>
      <td>${u.campaign || "-"}</td>
      <td>${u.vendite}</td>
    `;
    body.appendChild(tr);
  });
}

// =========================================================
// Ordini
// =========================================================
function renderOrdini(arr) {
  const body = document.getElementById("ordini-body");
  body.innerHTML = "";

  arr.forEach(o => {
    const prodotti = o.prodotti
      .map(p => `${p.titolo_breve || p.titolo} × ${p.qty}`)
      .join("<br>");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${new Date(o.data_ordine).toLocaleDateString("it-IT")}</td>
      <td>${(o.totale_cent / 100).toFixed(2)}€</td>
      <td>${o.stato}</td>
      <td>${prodotti}</td>
    `;
    body.appendChild(tr);
  });
}
