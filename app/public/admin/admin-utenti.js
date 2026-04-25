/* =========================================================
   ADMIN UTENTI — Versione SQL Definitiva 2027.950
   PATCH: Sincronizzazione percorsi /api/admin/ + KPI Real-time
========================================================= */

document.addEventListener("critical-ready", async () => {
  console.log("[ADMIN] Init admin-utenti.js (Sincronizzazione Backend)");
  
  // Sincronizzazione Brevo Silenziosa all'avvio
  syncBrevoAuto();
  // Caricamento Lista
  caricaUtenti();
});

/* =========================================================
   Helper: Formattazione Data Leggibile
========================================================= */
function fDate(d) {
  if (!d || d === "" || d === "Sì") return d || "—";
  try {
    const data = new Date(d);
    return data.toLocaleDateString('it-IT') + " " + data.toLocaleTimeString('it-IT', {hour: '2-digit', minute:'2-digit'});
  } catch(e) { return d; }
}

/* =========================================================
   FETCH ADMIN (Invia Token SQL automaticamente)
========================================================= */
async function adminGet(path, options = {}) {
  // Aggiungiamo /api davanti ai percorsi se manca
  const fullPath = path.startsWith("/api") ? path : `/api${path}`;
  
  const res = await window.fetchUniversale(fullPath, options, { retries: 2 });
  return res.json();
}

async function syncBrevoAuto() {
  try {
    await adminGet("/admin/utenti/sync-brevo");
    console.log("🟢 [BREVO] Sync OK");
  } catch (err) { console.warn("🟡 [BREVO] Sync fallito o non necessario"); }
}

/* =========================================================
   KPI & TABELLA
========================================================= */
async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  if (!tbody) return;
  tbody.innerHTML = "<tr><td colspan='15'>Interrogazione SQL in corso...</td></tr>";

  try {
    // Chiamata al backend admin-utenti.cjs
    const data = await adminGet("/admin/utenti/lista");

    if (!data.success) throw new Error(data.error || "Errore API");

    const lista = data.utenti || [];

    // Calcolo KPI (basato sulla lista processata dal backend)
    const kpi = calcolaKPI(lista);
    stampaKPI(kpi);

    tbody.innerHTML = "";

    lista.forEach(u => {
      // Calcolo stato ban dinamico
      const isBannato = (u.bloccato && (!u.sbloccato || new Date(u.bloccato) > new Date(u.sbloccato)));
      
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${u.email}</td>
        <td><small>${u.codice_fiscale || "-"}</small></td>
        <td>${fDate(u.registrato)}</td>
        <td>${fDate(u.login)}</td>
        <td>${fDate(u.logout)}</td>
        <td>${fDate(u.eliminato)}</td>
        <td>${fDate(u.bloccato)}</td>
        <td>${fDate(u.sbloccato)}</td>
        <td style="color: ${isBannato ? '#ff4d4d' : '#2ecc71'}"><b>${isBannato ? 'SÌ' : 'no'}</b></td>
        <td>${u.iscritto ? '✅' : '—'}</td>
        <td>${u.disiscritto ? '❌' : '—'}</td>
        <td>${u.registrato_brevo === "presente" ? '✅' : '—'}</td>
        <td>${u.cliente_brevo === "presente" ? '💰' : '—'}</td>
        <td>${u.cliente_db === "sì" ? '📦' : '—'}</td>
        <td>
          ${u.email !== "amministratore" ? `
            <div class="admin-actions-flex">
              <button class="btn-blocca" data-email="${u.email}">Blocca</button>
              <button class="btn-sblocca" data-email="${u.email}">Sblocca</button>
              <button class="btn-elimina" data-email="${u.email}">Elimina</button>
            </div>
          ` : "<em>SuperAdmin</em>"}
        </td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("❌ [ADMIN] Errore:", err);
    tbody.innerHTML = "<tr><td colspan='15'>Errore caricamento. Verifica Token o Backend.</td></tr>";
  }
}

/* =========================================================
   LISTENERS (Gestione click pulsanti)
========================================================= */
document.addEventListener("click", async (e) => {
  const email = e.target.dataset.email;
  if (!email) return;

  const btn = e.target;
  let azione = "";

  if (btn.classList.contains("btn-blocca")) azione = "blocca";
  if (btn.classList.contains("btn-sblocca")) azione = "sblocca";
  if (btn.classList.contains("btn-elimina")) {
      if (!confirm(`Eliminare definitivamente ${email}?`)) return;
      azione = "elimina";
  }

  if (azione) {
    try {
      const res = await adminGet(`/admin/utenti/${azione}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });
      if (res.success) caricaUtenti();
    } catch (err) { alert("Errore durante l'operazione."); }
  }
});

// Nota: calcolaKPI() e stampaKPI() restano quelli del tuo file originale 
// ma ora riceveranno dati puliti dal backend SQL.
