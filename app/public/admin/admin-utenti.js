/* =========================================================
   ADMIN UTENTI — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Universale Admin
========================================================= */

console.log("📌 [ADMIN-UTENTI 2058] File caricato");

/* =========================================================
   Helper: Formattazione Data
========================================================= */
function fDate(d) {
  if (!d || d === "" || d === "Sì") return d || "—";
  try {
    const data = new Date(d);
    return (
      data.toLocaleDateString("it-IT") +
      " " +
      data.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })
    );
  } catch (e) {
    return d;
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

  const fullPath = path.startsWith("/api") ? path : `/api${path}`;

  const res = await fetch(fullPath, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [ADMIN-UTENTI] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", fullPath);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   PAGE INIT — chiamata da Loader Universale Admin 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [ADMIN-UTENTI 2058] pageInit() avviata");

  syncBrevoAuto();
  caricaUtenti();

  /* =========================================================
     LISTENERS (Blocca / Sblocca / Elimina)
  ========================================================== */
  document.addEventListener("click", async (e) => {
    const email = e.target.dataset.email;
    if (!email) return;

    const btn = e.target;
    let azione = "";

    if (btn.classList.contains("btn-blocca")) azione = "bloccaUtente";
    if (btn.classList.contains("btn-sblocca")) azione = "sbloccaUtente";
    if (btn.classList.contains("btn-elimina")) {
      if (!confirm(`Eliminare definitivamente ${email}?`)) return;
      azione = "eliminaUtente";
    }

    if (!azione) return;

    console.log(`⚡ [ADMIN-UTENTI] Azione: ${azione} → ${email}`);

    const ok = await adminApi(`/api/admin/utenti/${azione}`, {
      method: "POST",
      body: JSON.stringify({ email })
    });

    if (ok) {
      console.log("🟢 [ADMIN-UTENTI] Operazione OK → ricarico utenti");
      caricaUtenti();
    } else {
      console.warn("❌ [ADMIN-UTENTI] Errore operazione");
      alert("Errore durante l'operazione.");
    }
  });
};

/* =========================================================
   SYNC BREVO AUTOMATICO
========================================================= */
async function syncBrevoAuto() {
  console.log("🔄 [ADMIN-UTENTI] Sync Brevo automatico…");

  const ok = await adminApi("/api/admin/utenti/syncBrevo", { method: "GET" });
  if (ok) console.log("🟢 [BREVO] Sync OK");
  else console.warn("🟡 [BREVO] Sync fallito o non necessario");
}

/* =========================================================
   CARICA UTENTI + KPI
========================================================= */
async function caricaUtenti() {
  console.log("📥 [ADMIN-UTENTI] Carico lista utenti…");

  const tbody = document.querySelector("#tabella-utenti tbody");
  if (!tbody) {
    console.warn("❌ [ADMIN-UTENTI] tbody non trovato");
    return;
  }

  tbody.innerHTML =
    "<tr><td colspan='15'>Interrogazione SQL in corso...</td></tr>";

  const data = await adminApi("/api/admin/utenti/getListaUtenti", {
    method: "GET"
  });

  if (!data) {
    console.warn("❌ [ADMIN-UTENTI] Errore caricamento utenti");
    tbody.innerHTML =
      "<tr><td colspan='15'>Errore caricamento. Verifica Token o Backend.</td></tr>";
    return;
  }

  const lista = data.utenti || [];

  console.log("📊 [ADMIN-UTENTI] Utenti caricati:", lista.length);

  const kpi = calcolaKPI(lista);
  stampaKPI(kpi);

  tbody.innerHTML = "";

  lista.forEach((u) => {
    const isBannato =
      u.bloccato &&
      (!u.sbloccato || new Date(u.bloccato) > new Date(u.sbloccato));

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
      <td style="color: ${isBannato ? "#ff4d4d" : "#2ecc71"}">
        <b>${isBannato ? "SÌ" : "no"}</b>
      </td>
      <td>${u.iscritto ? "✅" : "—"}</td>
      <td>${u.disiscritto ? "❌" : "—"}</td>
      <td>${u.registrato_brevo === "presente" ? "✅" : "—"}</td>
      <td>${u.cliente_brevo === "presente" ? "💰" : "—"}</td>
      <td>${u.cliente_db === "sì" ? "📦" : "—"}</td>
      <td>
        ${
          u.email !== "amministratore"
            ? `
          <div class="admin-actions-flex">
            <button class="btn-blocca" data-email="${u.email}">Blocca</button>
            <button class="btn-sblocca" data-email="${u.email}">Sblocca</button>
            <button class="btn-elimina" data-email="${u.email}">Elimina</button>
          </div>
        `
            : "<em>SuperAdmin</em>"
        }
      </td>
    `;
    tbody.appendChild(tr);
  });
}

/* =========================================================
   KPI
========================================================= */
function calcolaKPI(lista) {
  return {
    totali: lista.length,
    iscrittiNL: lista.filter(u => u.iscritto).length,
    bannati: lista.filter(u =>
      u.bloccato &&
      (!u.sbloccato || new Date(u.bloccato) > new Date(u.sbloccato))
    ).length,
    clientiBrevo: lista.filter(u => u.cliente_brevo === "presente").length,
    clientiDB: lista.filter(u => u.cliente_db === "sì").length
  };
}

function stampaKPI(kpi) {
  const box = document.getElementById("kpi-container");
  if (!box) return;

  box.innerHTML = `
    <div class="kpi-card"><h3>Totali</h3><p>${kpi.totali}</p></div>
    <div class="kpi-card"><h3>Iscritti NL</h3><p>${kpi.iscrittiNL}</p></div>
    <div class="kpi-card"><h3>Bannati</h3><p>${kpi.bannati}</p></div>
    <div class="kpi-card"><h3>Clienti Brevo</h3><p>${kpi.clientiBrevo}</p></div>
    <div class="kpi-card"><h3>Clienti DB</h3><p>${kpi.clientiDB}</p></div>
  `;
}
