/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione 2026 — PATCH EVENTI COMPLETI + KPI
========================================================= */

document.addEventListener("admin-header-loaded", caricaUtenti);

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore admin fetch: " + url);
  return res.json();
}

// ---------------------------------------------------------
// Calcolo KPI
// ---------------------------------------------------------
function calcolaKPI(lista) {
  const tot = lista.length;

  const kpi = {
    totale: tot,
    registrati: lista.filter(u => u.registrato).length,
    login: lista.filter(u => u.login).length,
    logout: lista.filter(u => u.logout).length,
    eliminati: lista.filter(u => u.eliminato).length,
    bloccati: lista.filter(u => u.bloccato).length,
    sbloccati: lista.filter(u => u.sbloccato).length,
    iscritto: lista.filter(u => u.iscritto).length,
    disiscritto: lista.filter(u => u.disiscritto).length
  };

  return kpi;
}

// ---------------------------------------------------------
// Stampa KPI
// ---------------------------------------------------------
function stampaKPI(kpi) {
  const box = document.getElementById("kpi-container");

  box.innerHTML = `
    <div class="kpi-item"><b>Totale utenti:</b> ${kpi.totale}</div>

    <div class="kpi-item"><b>Registrati:</b> ${kpi.registrati} (${((kpi.registrati/kpi.totale)*100).toFixed(1)}%)</div>
    <div class="kpi-item"><b>Login:</b> ${kpi.login} (${((kpi.login/kpi.totale)*100).toFixed(1)}%)</div>
    <div class="kpi-item"><b>Logout:</b> ${kpi.logout} (${((kpi.logout/kpi.totale)*100).toFixed(1)}%)</div>

    <div class="kpi-item"><b>Eliminati:</b> ${kpi.eliminati} (${((kpi.eliminati/kpi.totale)*100).toFixed(1)}%)</div>
    <div class="kpi-item"><b>Bloccati:</b> ${kpi.bloccati} (${((kpi.bloccati/kpi.totale)*100).toFixed(1)}%)</div>
    <div class="kpi-item"><b>Sbloccati:</b> ${kpi.sbloccati} (${((kpi.sbloccati/kpi.totale)*100).toFixed(1)}%)</div>

    <div class="kpi-item"><b>Iscritti NL:</b> ${kpi.iscritto} (${((kpi.iscritto/kpi.totale)*100).toFixed(1)}%)</div>
    <div class="kpi-item"><b>Disiscritti NL:</b> ${kpi.disiscritto} (${((kpi.disiscritto/kpi.totale)*100).toFixed(1)}%)</div>
  `;
}

// ---------------------------------------------------------
// Carica utenti + KPI + tabella
// ---------------------------------------------------------
async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='10'>Caricamento…</td></tr>";

  try {
    const data = await adminGet("/api/admin/utenti/lista");

    // ⭐ Calcolo KPI
    const kpi = calcolaKPI(data.utenti);
    stampaKPI(kpi);

    // ⭐ Stampa tabella
    tbody.innerHTML = "";

    (data.utenti || []).forEach(u => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${u.email}</td>
        <td>${u.codice_fiscale}</td>

        <td>${u.registrato || ""}</td>
        <td>${u.login || ""}</td>
        <td>${u.logout || ""}</td>
        <td>${u.eliminato || ""}</td>
        <td>${u.bloccato || ""}</td>
        <td>${u.sbloccato || ""}</td>

        <td>${u.iscritto || ""}</td>
        <td>${u.disiscritto || ""}</td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='10'>Errore caricamento utenti.</td></tr>";
  }
}
