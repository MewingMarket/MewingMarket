// =========================================================
// Dashboard Admin — UNIVERSAL JSON PATCH 2027.970
// =========================================================

document.addEventListener("critical-ready", async () => {
  console.log("🔥 Dashboard INIT - Autonoma");

  const token = localStorage.getItem("token");
  if (!token) {
    location.href = "/admin/login";
    return;
  }

  try {
    // Attiva endpoint base rimborso (diagnostica)
    await adminApi("/api/rimborso", { method: "GET" });

    // Dashboard principale
    const data = await adminApi("/api/admin/dashboard/getDashboard", {
      method: "GET"
    });

    if (!data) throw new Error("Errore accesso");

    console.log("📦 Dati ricevuti:", data);

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
});

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
   KPI
========================================================= */
function renderKPI(data) {
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
  if (!confirm("Sei sicuro?")) return;

  const data = await adminApi(`/api/rimborso/${tipo}/${id}`, {
    method: "POST"
  });

  if (data) location.reload();
  else alert("Errore rimborso.");
}
