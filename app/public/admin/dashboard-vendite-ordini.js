// =========================================================
// Dashboard Admin — UNIVERSAL JSON PATCH 2027.970
// PATCH 2050 — AUTORUN + DEBUG ESTESO
// PATCH 2027.1 — Auto‑Ottimizzazione Catalogo
// =========================================================

console.log("📌 [DASHBOARD-ADMIN] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [DASHBOARD-ADMIN] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [DASHBOARD-ADMIN] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [DASHBOARD-ADMIN] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [DASHBOARD-ADMIN] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [DASHBOARD-ADMIN] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [DASHBOARD-ADMIN] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [DASHBOARD-ADMIN] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [DASHBOARD-ADMIN] critical-ready già presente → avvio pagina");
  avviaDashboard();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO + PATCH AUTO‑OPT
// =========================================================
async function avviaDashboard() {
  console.log("🔥 Dashboard INIT - Autonoma");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("🔒 [DASHBOARD-ADMIN] Token mancante → redirect login");
    location.href = "/admin/login";
    return;
  }

  /* ---------------------------------------------------------
     🔥 PATCH: aggiungo bottone Auto‑Ottimizza Catalogo
  --------------------------------------------------------- */
  aggiungiBottoneAutoOptimize();

  try {
    console.log("🔧 [DASHBOARD-ADMIN] Diagnostica rimborso…");
    await adminApi("/api/rimborso", { method: "GET" });

    console.log("📥 [DASHBOARD-ADMIN] Carico dati dashboard…");
    const data = await adminApi("/api/admin/dashboard/getDashboard", {
      method: "GET"
    });

    if (!data) throw new Error("Errore accesso");

    console.log("📦 [DASHBOARD-ADMIN] Dati ricevuti:", data);

    renderKPI(data);
    renderTopProdotti(data?.vendite?.topProdotti || []);
    renderOrdini(data?.ordini?.lista || []);

  } catch (err) {
    console.error("❌ ERRORE DASHBOARD:", err);
    const body = document.getElementById("ordini-body");
    if (body) {
      body.innerHTML = `<tr><td colspan="11" style="color:red; text-align:center;">Errore: ${err.message}</td></tr>`;
    }
  }
}

/* =========================================================
   WRAPPER UNIVERSALE ADMIN (token + universal-json)
========================================================= */
async function adminApi(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [DASHBOARD-ADMIN] Token scaduto → redirect login");
    localStorage.removeItem("token");
    location.href = "/admin/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   🔥 PATCH: Bottone Auto‑Ottimizzazione Catalogo
========================================================= */
function aggiungiBottoneAutoOptimize() {
  const header = document.querySelector(".dashboard-container");
  if (!header) return;

  const btn = document.createElement("button");
  btn.id = "btn-auto-opt";
  btn.className = "btn-primario";
  btn.style = "margin-bottom:20px; width:100%; padding:15px; font-weight:bold;";
  btn.textContent = "⚙️ Auto‑Ottimizza Catalogo (AI)";

  const logBox = document.createElement("pre");
  logBox.id = "auto-opt-log";
  logBox.style = `
    display:none;
    background:#111;
    color:#0f0;
    padding:15px;
    margin-top:15px;
    font-size:0.85rem;
    border-radius:6px;
    max-height:300px;
    overflow-y:auto;
  `;

  btn.onclick = async () => {
    logBox.style.display = "block";
    logBox.textContent = "⏳ Avvio pipeline AI...\n";

    const data = await adminApi("/api/admin/dashboard/autoOptimize", {
      method: "POST"
    });

    if (!data) {
      logBox.textContent += "\n❌ Errore durante l'ottimizzazione.";
      return;
    }

    logBox.textContent += data.log.join("\n") + "\n\n✅ COMPLETATO";
  };

  header.prepend(logBox);
  header.prepend(btn);
}

/* =========================================================
   KPI
========================================================= */
function renderKPI(data) {
  console.log("📊 [DASHBOARD-ADMIN] Render KPI");

  const v = data?.vendite?.kpi || {};
  const o = data?.ordini?.kpi || {};

  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  safeSet("kpi-vendite", v.venditeTotali ?? "0");
  safeSet("kpi-revenue", (v.revenueTotale ?? 0).toFixed(2) + "€");
  safeSet("kpi-prodotti", v.prodottiVenduti ?? "0");
  safeSet("kpi-ordini", o.totali ?? "0");
  safeSet("kpi-ordini-completati", o.completati ?? "0");
  safeSet("kpi-ordini-annullati", o.annullati ?? "0");
}

/* =========================================================
   ORDINI
========================================================= */
function renderOrdini(lista) {
  console.log("📦 [DASHBOARD-ADMIN] Render ordini:", lista.length);

  const body = document.getElementById("ordini-body");
  if (!body) return;

  body.innerHTML = "";

  if (lista.length === 0) {
    body.innerHTML = '<tr><td colspan="11">Nessun ordine presente.</td></tr>';
    return;
  }

  lista.forEach(ord => {
    const tr = document.createElement("tr");
    const prodotti = (ord.prodotti || [])
      .map(p => `${p.titolo || 'Prodotto'} x${p.qty || 1}`)
      .join(", ");

    tr.innerHTML = `
      <td>${ord.id}</td>
      <td>${new Date(ord.data_ordine).toLocaleDateString()}</td>
      <td>${(ord.totale_cent / 100).toFixed(2)}€</td>
      <td><span class="badge-${ord.stato}">${ord.stato}</span></td>
      <td>${prodotti}</td>
      <td>${ord.email || '—'}</td>
      <td>${ord.codice_fiscale || '—'}</td>
      <td>${ord.rimborso?.motivo || '—'}</td>
      <td>${ord.rimborso?.categoria || '—'}</td>
      <td>${ord.rimborso?.stato || '—'}</td>
      <td>
        ${ord.rimborso?.stato === 'in_attesa'
          ? `<button onclick="azioneRimborso(${ord.id}, 'procediRichiesta')">OK</button>`
          : '—'}
      </td>
    `;
    body.appendChild(tr);
  });
}

/* =========================================================
   RIMBORSO
========================================================= */
async function azioneRimborso(id, tipo) {
  console.log("💸 [DASHBOARD-ADMIN] Azione rimborso:", id, tipo);

  if (!confirm("Sei sicuro?")) return;

  const data = await adminApi(`/api/rimborso/${tipo}/${id}`, {
    method: "POST"
  });

  if (data) location.reload();
  else alert("Errore rimborso.");
}
