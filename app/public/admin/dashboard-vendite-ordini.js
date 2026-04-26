// =========================================================
// Dashboard Admin — Versione 2026.FINAL (No api.js)
// =========================================================

document.addEventListener("critical-ready", async () => {
  console.log("🔥 Dashboard INIT - Autonoma");

  const token = localStorage.getItem("token");
  if (!token) {
    console.error("❌ Token mancante");
    location.href = "/admin/login";
    return;
  }

  try {
    // Chiamata diretta al server
    const response = await fetch("/api/admin/dashboard", {
      method: "GET",
      headers: {
        "Authorization": "Bearer " + token,
        "Content-Type": "application/json"
      }
    });

    console.log("📡 Status:", response.status);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || "Errore accesso");
    }

    console.log("📦 Dati ricevuti:", data);
    
    renderKPI(data);
    renderTopProdotti(data?.vendite?.topProdotti || []);
    renderOrdini(data?.ordini?.lista || []);

  } catch (err) {
    console.error("❌ ERRORE DASHBOARD:", err);
    const body = document.getElementById("ordini-body");
    if(body) body.innerHTML = `<tr><td colspan="11" style="color:red; text-align:center;">Errore: ${err.message}</td></tr>`;
  }
});

function renderKPI(data) {
  const v = data?.vendite?.kpi || {};
  const o = data?.ordini?.kpi || {};
  
  const safeSet = (id, val) => {
    const el = document.getElementById(id);
    if(el) el.textContent = val;
  };

  safeSet("kpi-vendite", v.venditeTotali ?? "0");
  safeSet("kpi-revenue", (v.revenueTotale ?? 0).toFixed(2) + "€");
  safeSet("kpi-prodotti", v.prodottiVenduti ?? "0");
  safeSet("kpi-ordini", o.totali ?? "0");
  safeSet("kpi-ordini-completati", o.completati ?? "0");
  safeSet("kpi-ordini-annullati", o.annullati ?? "0");
}

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
    const prodotti = (ord.prodotti || []).map(p => `${p.titolo || 'Prodotto'} x${p.qty || 1}`).join(", ");
    
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
        ${ord.rimborso?.stato === 'in_attesa' ? 
          `<button onclick="azioneRimborso(${ord.id}, 'procedi')">OK</button>` : '—'}
      </td>
    `;
    body.appendChild(tr);
  });
}

// Global per i bottoni
async function azioneRimborso(id, tipo) {
    if(!confirm("Sei sicuro?")) return;
    const token = localStorage.getItem("token");
    const res = await fetch(`/api/rimborso/${tipo}/${id}`, { 
        method: 'POST', 
        headers: { "Authorization": "Bearer " + token } 
    });
    const d = await res.json();
    if(d.success) location.reload();
    else alert(d.error);
}
