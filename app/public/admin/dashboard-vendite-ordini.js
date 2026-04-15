// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Versione 2026.302 (PATCH CHIRURGICA + fetchCritico)
// =========================================================

console.log("🔥 dashboard-vendite-ordini.js CARICATO");

/* =========================================================
   fetchCritico — retry + anti-HTML + anti-502
========================================================= */
async function fetchCritico(url, options = {}, cfg = {}) {
  const { retries = 3, backoff = 400 } = cfg;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      const ct = res.headers.get("content-type") || "";

      // Anti-HTML
      if (ct.includes("text/html")) {
        const html = await res.text();
        throw new Error("HTML inatteso: " + html.slice(0, 200));
      }

      // Retry su 502/503/504
      if (!res.ok) {
        if ([502, 503, 504].includes(res.status) && attempt < retries) {
          await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
          attempt++;
          continue;
        }
        throw new Error("HTTP " + res.status);
      }

      return res;

    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
      attempt++;
    }
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  if (!token || sessionState !== "1") {
    alert("Sessione scaduta. Effettua di nuovo il login.");
    location.href = "/admin/login.html";
    return;
  }

  try {
    // ⭐ PATCH: fetchCritico
    const res = await fetchCritico(
      "/api/admin/dashboard",
      {
        method: "GET",
        headers: {
          Authorization: "Bearer " + token,
          "X-Debug": "admin-dashboard"
        }
      },
      { retries: 3, backoff: 400 }
    );

    const data = await res.json();
    if (!data.success) {
      alert("Errore: " + (data.error || "Accesso negato"));
      return;
    }

    renderKPI(data);
    renderTopProdotti(data?.vendite?.topProdotti || []);
    renderUTM(data?.vendite?.utm || []);
    renderOrdini(data?.ordini?.lista || []);

  } catch (err) {
    console.error("❌ ERRORE GENERALE DASHBOARD:", err);
    alert("Errore di connessione.");
  }
});

// =========================================================
// KPI — PATCH tempo completamento
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

  const aov = listaOrdini.length
    ? (listaOrdini.reduce((s, o) => s + (o.totale_cent || 0), 0) / listaOrdini.length) / 100
    : 0;
  document.getElementById("kpi-aov").textContent = aov.toFixed(2) + "€";

  const tassoAnnullamento = ordini.totali
    ? ((ordini.annullati / ordini.totali) * 100).toFixed(1)
    : 0;
  document.getElementById("kpi-tasso-annullamento").textContent = tassoAnnullamento + "%";

  const top = topProdotti[0];
  document.getElementById("kpi-top-prodotto").textContent =
    top ? `ID ${top.prodotto_id} (${top.vendite} vendite)` : "—";

  // ⭐ PATCH: tempo completamento (bug fix)
  const completati = listaOrdini.filter(o => o.stato === "completato" && o.data_completamento);
  let tempoMedio = "—";

  if (completati.length > 0) {
    const diff = completati.map(o => {
      const d1 = new Date(o.data_ordine).getTime();
      const d2 = new Date(o.data_completamento).getTime();
      return d2 - d1;
    });

    const mediaMs = diff.reduce((a, b) => a + b, 0) / diff.length;
    const ore = Math.round(mediaMs / 1000 / 60 / 60);
    tempoMedio = ore + "h";
  }

  document.getElementById("kpi-tempo-completamento").textContent = tempoMedio;

  const rimborsati = listaOrdini.filter(o => o.stato === "rimborsato").length;
  const percRimb = ordini.totali
    ? ((rimborsati / ordini.totali) * 100).toFixed(1)
    : 0;

  const el = document.getElementById("kpi-ordini-rimborsati");
  if (el) el.textContent = percRimb + "%";
}
