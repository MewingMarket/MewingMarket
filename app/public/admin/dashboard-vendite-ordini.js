// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Versione 2026.97 — SQL LIVE (con patch diagnostica + KPI avanzati)
// =========================================================

console.log("🔥 dashboard-vendite-ordini.js CARICATO");

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  console.log("🔑 TOKEN:", token);
  console.log("🔑 sessionState:", sessionState);

  if (!token || sessionState !== "1") {
    alert("Sessione scaduta. Effettua di nuovo il login.");
    location.href = "/admin/login.html";
    return;
  }

  console.log("🚀 FETCH /api/admin/dashboard PARTITA");
  console.log("➡️ HEADER Authorization:", "Bearer " + token);

  try {
    const res = await fetch("/api/admin/dashboard", {
      method: "GET",
      headers: {
        Authorization: "Bearer " + token,
        "X-Debug": "admin-dashboard"
      }
    });

    console.log("📥 STATUS:", res.status);
    console.log("📥 HEADERS:", Object.fromEntries(res.headers.entries()));

    const ct = res.headers.get("content-type");
    console.log("📥 CONTENT-TYPE:", ct);

    if (ct && ct.includes("text/html")) {
      const text = await res.text();
      console.error("❌ ERRORE: ricevuto HTML invece di JSON:", text.slice(0, 500));
      alert("Errore server (HTML ricevuto). Controlla i log.");
      return;
    }

    const data = await res.json();
    console.log("📦 DATA RICEVUTI (RAW):", data);

    if (!data.success) {
      alert("Errore: " + (data.error || "Accesso negato"));
      return;
    }

    try { renderKPI(data); } catch (e) { console.error("❌ ERRORE renderKPI:", e); }
    try { renderTopProdotti(data?.vendite?.topProdotti || []); } catch (e) { console.error("❌ ERRORE renderTopProdotti:", e); }
    try { renderUTM(data?.vendite?.utm || []); } catch (e) { console.error("❌ ERRORE renderUTM:", e); }
    try { renderOrdini(data?.ordini?.lista || [], data?.vendite?.utm || []); } catch (e) { console.error("❌ ERRORE renderOrdini:", e); }

  } catch (err) {
    console.error("❌ ERRORE GENERALE DASHBOARD:", err);
    alert("Errore di connessione.");
  }
});

// =========================================================
// KPI BASE + KPI AVANZATI
// =========================================================
function renderKPI(data) {
  const vendite = data?.vendite?.kpi || {};
  const ordini = data?.ordini?.kpi || {};
  const listaOrdini = data?.ordini?.lista || [];
  const topProdotti = data?.vendite?.topProdotti || [];

  document.getElementById("kpi-vendite").textContent = vendite.venditeTotali ?? "0";
  document.getElementById("kpi-revenue").textContent = (vendite.revenueTotale ?? 0) + "€";
  document.getElementById("kpi-prodotti").textContent = vendite.prodottiVenduti ?? "0";
  document.getElementById("kpi-ordini").textContent = ordini.totali ?? "0";
  document.getElementById("kpi-ordini-completati").textContent = ordini.completati ?? "0";
  document.getElementById("kpi-ordini-annullati").textContent = ordini.annullati ?? "0";

  // =========================================================
  // KPI AVANZATI
  // =========================================================

  // AOV
  const aov = listaOrdini.length
    ? (listaOrdini.reduce((s, o) => s + (o.totale_cent || 0), 0) / listaOrdini.length) / 100
    : 0;
  document.getElementById("kpi-aov").textContent = aov.toFixed(2) + "€";

  // Tasso annullamento
  const tassoAnnullamento = ordini.totali
    ? ((ordini.annullati / ordini.totali) * 100).toFixed(1)
    : 0;
  document.getElementById("kpi-tasso-annullamento").textContent = tassoAnnullamento + "%";

  // Prodotto più venduto
  const top = topProdotti[0];
  document.getElementById("kpi-top-prodotto").textContent =
    top ? `ID ${top.prodotto_id} (${top.vendite} vendite)` : "—";

  // Clienti ricorrenti
  const utentiCount = {};
  listaOrdini.forEach(o => {
    utentiCount[o.utente_id] = (utentiCount[o.utente_id] || 0) + 1;
  });
  const ricorrenti = Object.values(utentiCount).filter(n => n > 1).length;
  const ricPerc = listaOrdini.length
    ? ((ricorrenti / Object.keys(utentiCount).length) * 100).toFixed(1)
    : 0;
  document.getElementById("kpi-clienti-ricorrenti").textContent = ricPerc + "%";

  // Tempo medio completamento (solo ordini completati)
  const completati = listaOrdini.filter(o => o.stato === "completato");
  let tempoMedio = "—";

  if (completati.length > 0) {
    const diff = completati.map(o => {
      const d1 = new Date(o.data_ordine).getTime();
      const d2 = new Date(o.data_ordine).getTime(); // non hai campo "data completamento"
      return d2 - d1;
    });

    const mediaMs = diff.reduce((a, b) => a + b, 0) / diff.length;
    const ore = Math.round(mediaMs / 1000 / 60 / 60);
    tempoMedio = ore + "h";
  }

  document.getElementById("kpi-tempo-completamento").textContent = tempoMedio;
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
// Ordini + colonne nuove (cliente + origine)
// =========================================================
function renderOrdini(arr) {
  const body = document.getElementById("ordini-body");
  body.innerHTML = "";

  arr.forEach(o => {
    const prodotti = (o.prodotti || [])
      .map(p => `${p.titolo_breve || p.titolo || "Prodotto"} × ${p.qty ?? 1}`)
      .join("<br>");

    const origine = o.origine_sintetica || "Direct";
    const cliente = o.email || "—";

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id ?? "-"}</td>
      <td>${o.data_ordine ? new Date(o.data_ordine).toLocaleDateString("it-IT") : "-"}</td>
      <td>${((o.totale_cent ?? 0) / 100).toFixed(2)}€</td>
      <td>${o.stato ?? "-"}</td>
      <td>${prodotti}</td>
      <td>${cliente}</td>
      <td>${origine}</td>
    `;
    body.appendChild(tr);
  });
}
