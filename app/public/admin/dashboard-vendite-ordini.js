// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Versione 2026.97 — SQL LIVE (con patch diagnostica)
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

    console.log("📦 DATA RICEVUTI:", data);

    if (!data.success) {
      alert("Errore: " + (data.error || "Accesso negato"));
      return;
    }

    // ============================
    // RENDER KPI
    // ============================
    try {
      console.log("➡️ renderKPI");
      renderKPI(data);
    } catch (e) {
      console.error("❌ ERRORE renderKPI:", e);
    }

    // ============================
    // TOP PRODOTTI
    // ============================
    try {
      console.log("➡️ renderTopProdotti");
      renderTopProdotti(data?.vendite?.topProdotti || []);
    } catch (e) {
      console.error("❌ ERRORE renderTopProdotti:", e);
    }

    // ============================
    // UTM
    // ============================
    try {
      console.log("➡️ renderUTM");
      renderUTM(data?.vendite?.utm || []);
    } catch (e) {
      console.error("❌ ERRORE renderUTM:", e);
    }

    // ============================
    // ORDINI
    // ============================
    try {
      console.log("➡️ renderOrdini");
      renderOrdini(data?.ordini?.lista || []);
    } catch (e) {
      console.error("❌ ERRORE renderOrdini:", e);
    }

  } catch (err) {
    console.error("❌ ERRORE GENERALE DASHBOARD:", err);
    alert("Errore di connessione.");
  }
});

// =========================================================
// KPI
// =========================================================
function renderKPI(data) {
  console.log("🔍 KPI DATA:", data?.vendite?.kpi, data?.ordini?.kpi);

  document.getElementById("kpi-vendite").textContent =
    data?.vendite?.kpi?.venditeTotali ?? "0";

  document.getElementById("kpi-revenue").textContent =
    (data?.vendite?.kpi?.revenueTotale ?? 0) + "€";

  document.getElementById("kpi-prodotti").textContent =
    data?.vendite?.kpi?.prodottiVenduti ?? "0";

  document.getElementById("kpi-ordini").textContent =
    data?.ordini?.kpi?.totali ?? "0";

  document.getElementById("kpi-ordini-completati").textContent =
    data?.ordini?.kpi?.completati ?? "0";

  document.getElementById("kpi-ordini-annullati").textContent =
    data?.ordini?.kpi?.annullati ?? "0";
}

// =========================================================
// Top prodotti
// =========================================================
function renderTopProdotti(arr) {
  console.log("🔍 TOP PRODOTTI:", arr);

  const body = document.getElementById("top-prodotti-body");
  body.innerHTML = "";

  arr.forEach(p => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${p.prodotto_id ?? "-"}</td>
      <td>${p.vendite ?? 0}</td>
      <td>${((p.revenue ?? 0) / 100).toFixed(2)}€</td>
    `;
    body.appendChild(tr);
  });
}

// =========================================================
// UTM
// =========================================================
function renderUTM(arr) {
  console.log("🔍 UTM:", arr);

  const body = document.getElementById("utm-body");
  body.innerHTML = "";

  arr.forEach(u => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${u.source || "-"}</td>
      <td>${u.medium || "-"}</td>
      <td>${u.campaign || "-"}</td>
      <td>${u.vendite ?? 0}</td>
    `;
    body.appendChild(tr);
  });
}

// =========================================================
// Ordini
// =========================================================
function renderOrdini(arr) {
  console.log("🔍 ORDINI:", arr);

  const body = document.getElementById("ordini-body");
  body.innerHTML = "";

  arr.forEach(o => {
    const prodotti = (o.prodotti || [])
      .map(p => `${p.titolo_breve || p.titolo || "Prodotto"} × ${p.qty ?? 1}`)
      .join("<br>");

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id ?? "-"}</td>
      <td>${o.data_ordine ? new Date(o.data_ordine).toLocaleDateString("it-IT") : "-"}</td>
      <td>${((o.totale_cent ?? 0) / 100).toFixed(2)}€</td>
      <td>${o.stato ?? "-"}</td>
      <td>${prodotti}</td>
    `;
    body.appendChild(tr);
  });
}
