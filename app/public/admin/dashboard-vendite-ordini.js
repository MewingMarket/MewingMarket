// =========================================================
// Dashboard Admin — Vendite + Ordini (Unificata)
// Versione 2027.400 — PATCH: FETCH STANDARD + API PREFIX
// =========================================================

console.log("🔥 dashboard-vendite-ordini.js CARICATO");

/* =========================================================
   INIT SESSIONE — SOLO DOPO CRITICAL READY
========================================================= */
document.addEventListener("critical-ready", async () => {
  console.log("🔥 [ADMIN] Dashboard vendite/ordini INIT (CRITICAL READY)");

  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  if (!token || sessionState !== "1") {
    alert("Sessione scaduta. Effettua di nuovo il login.");
    location.href = "/login";
    return;
  }

  try {
    console.log("📡 TENTATIVO FETCH SU: /api/admin/dashboard");
    
    // ⭐ Utilizzo fetch standard per bypassare eventuali limiti di fetchUniversale
    const res = await fetch("/api/admin/dashboard", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json",
        "X-Debug": "admin-dashboard"
      }
    });

    console.log("📡 STATUS RISPOSTA:", res.status);

    const data = await res.json();
    console.log("📦 DATI RICEVUTI:", data);

    if (!data.success) {
      console.error("❌ ERRORE BACKEND:", data.error);
      alert("Errore: " + (data.error || "Accesso negato"));
      return;
    }

    // Rendering dei dati
    renderKPI(data);
    renderTopProdotti(data?.vendite?.topProdotti || []);
    renderOrdini(data?.ordini?.lista || []);

  } catch (err) {
    console.error("❌ ERRORE GENERALE DASHBOARD:", err);
    alert("Errore di connessione o errore nel parsing dei dati.");
  }
});

/* =========================================================
   KPI BASE + KPI AVANZATI + KPI RIMBORSATI
========================================================= */
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

  const utentiCount = {};
  listaOrdini.forEach(o => {
    utentiCount[o.utente_id] = (utentiCount[o.utente_id] || 0) + 1;
  });
  const ricorrenti = Object.values(utentiCount).filter(n => n > 1).length;
  const ricPerc = listaOrdini.length
    ? ((ricorrenti / Object.keys(utentiCount).length) * 100).toFixed(1)
    : 0;
  document.getElementById("kpi-clienti-ricorrenti").textContent = ricPerc + "%";

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

/* =========================================================
   ORDINI + Rendering Tabella
========================================================= */
function renderOrdini(arr) {
  const body = document.getElementById("ordini-body");
  if (!body) return;
  body.innerHTML = "";

  if (arr.length === 0) {
    body.innerHTML = `<tr><td colspan="11" style="text-align:center;">Nessun ordine trovato</td></tr>`;
    return;
  }

  arr.forEach(o => {
    const prodotti = (o.prodotti || [])
      .map(p => `${p.titolo_breve || p.titolo || "Prodotto"} × ${p.qty ?? 1}`)
      .join("<br>");

    const cliente = o.email || "—";
    const cf = o.codice_fiscale || "—";
    const motivo = o.rimborso?.motivo || "—";
    const statoRimborso = o.rimborso?.stato || "—";
    const categoria = o.rimborso?.categoria || "—";

    let azione = "—";
    if (statoRimborso === "in_attesa") {
      azione = `
        <button class="btn-rimborsa" data-id="${o.id}">Rimborsa</button>
        <button class="btn-rifiuta" data-id="${o.id}">Rifiuta</button>
      `;
    }

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${o.id ?? "-"}</td>
      <td>${o.data_ordine ? new Date(o.data_ordine).toLocaleDateString("it-IT") : "-"}</td>
      <td>${((o.totale_cent ?? 0) / 100).toFixed(2)}€</td>
      <td>${o.stato ?? "-"}</td>
      <td>${prodotti}</td>
      <td>${cliente}</td>
      <td>${cf}</td>
      <td>${motivo}</td>
      <td>${categoria}</td>
      <td>${statoRimborso}</td>
      <td>${azione}</td>
    `;
    body.appendChild(tr);
  });

  bindRimborsoButtons();
}

function bindRimborsoButtons() {
  document.querySelectorAll(".btn-rimborsa").forEach(btn => {
    btn.onclick = () => procediRimborso(btn.dataset.id);
  });

  document.querySelectorAll(".btn-rifiuta").forEach(btn => {
    btn.onclick = () => rifiutaRimborso(btn.dataset.id);
  });
}

// Funzioni TOP PRODOTTI (stub per evitare errori se mancano nel file originale)
function renderTopProdotti(top) {
    const container = document.getElementById("top-prodotti-body");
    if(!container) return;
    container.innerHTML = top.map(p => `
        <tr>
            <td>${p.prodotto_id}</td>
            <td>${p.vendite}</td>
            <td>${(p.revenue / 100).toFixed(2)}€</td>
        </tr>
    `).join("");
}

// Funzione procediRimborso e rifiutaRimborso (Uso fetch standard)
async function procediRimborso(id) {
  if (!confirm("Confermi il rimborso dell’ordine #" + id)) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/rimborso/procedi/${id}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    if (data.success) { alert("Rimborso completato."); location.reload(); }
    else { alert(data.error || "Errore rimborso."); }
  } catch (e) { alert("Errore connessione."); }
}

async function rifiutaRimborso(id) {
  if (!confirm("Vuoi rifiutare la richiesta di rimborso #" + id)) return;
  const token = localStorage.getItem("token");
  try {
    const res = await fetch(`/api/rimborso/rifiuta/${id}`, {
      method: "POST",
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    if (data.success) { alert("Richiesta rifiutata."); location.reload(); }
    else { alert(data.error || "Errore rifiuto."); }
  } catch (e) { alert("Errore connessione."); }
}
