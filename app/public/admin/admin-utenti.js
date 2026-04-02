/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione 2026 — EVENTI COMPLETI + KPI + BREVO + FALLBACK
   PATCH 2026.400 — Sync Brevo + RegistratoBrevo + ClienteBrevo + ClienteDB
========================================================= */

document.addEventListener("admin-header-loaded", async () => {
  await syncBrevoAuto();   // ⭐ Sync automatica
  caricaUtenti();          // ⭐ Carica tabella
});

// ---------------------------------------------------------
// FETCH ADMIN (senza adminFetch)
// ---------------------------------------------------------
async function adminGet(url, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(url, { ...options, headers });

  if (!res.ok) throw new Error("Errore admin fetch: " + url);
  return res.json();
}

// ---------------------------------------------------------
// SYNC BREVO AUTOMATICA
// ---------------------------------------------------------
async function syncBrevoAuto() {
  try {
    await adminGet("/api/admin/utenti/sync-brevo");
    console.log("Sync Brevo OK");
  } catch (err) {
    console.warn("Sync Brevo fallita, fallback attivo");
  }
}

// ---------------------------------------------------------
// SYNC BREVO MANUALE
// ---------------------------------------------------------
document.addEventListener("click", async (e) => {
  if (e.target.id === "btn-sync-brevo") {
    try {
      await adminGet("/api/admin/utenti/sync-brevo");
      alert("Sincronizzazione completata");
      caricaUtenti();
    } catch (err) {
      alert("Errore nella sincronizzazione Brevo");
    }
  }
});

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
    disiscritto: lista.filter(u => u.disiscritto).length,

    // ⭐ KPI BREVO
    registratoBrevo: lista.filter(u => u.registrato_brevo === "presente").length,
    clienteBrevo: lista.filter(u => u.cliente_brevo === "presente").length,

    // ⭐ KPI CLIENTI DB
    clienteDB: lista.filter(u => u.cliente_db === "sì").length
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

    <div class="kpi-item"><b>Registrati:</b> ${kpi.registrati}</div>
    <div class="kpi-item"><b>Login:</b> ${kpi.login}</div>
    <div class="kpi-item"><b>Logout:</b> ${kpi.logout}</div>

    <div class="kpi-item"><b>Eliminati:</b> ${kpi.eliminati}</div>
    <div class="kpi-item"><b>Bloccati:</b> ${kpi.bloccati}</div>
    <div class="kpi-item"><b>Sbloccati:</b> ${kpi.sbloccati}</div>

    <div class="kpi-item"><b>Iscritti NL:</b> ${kpi.iscritto}</div>
    <div class="kpi-item"><b>Disiscritti NL:</b> ${kpi.disiscritto}</div>

    <!-- ⭐ KPI BREVO -->
    <div class="kpi-item"><b>Registrati in Brevo:</b> ${kpi.registratoBrevo}</div>
    <div class="kpi-item"><b>Clienti Brevo:</b> ${kpi.clienteBrevo}</div>

    <!-- ⭐ KPI CLIENTI DB -->
    <div class="kpi-item"><b>Clienti DB:</b> ${kpi.clienteDB}</div>
  `;
}

// ---------------------------------------------------------
// Carica utenti + KPI + tabella
// ---------------------------------------------------------
async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='14'>Caricamento…</td></tr>";

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

        <!-- ⭐ BREVO -->
        <td>${u.registrato_brevo}</td>
        <td>${u.cliente_brevo}</td>

        <!-- ⭐ CLIENTE DB -->
        <td>${u.cliente_db}</td>

        <td>
          ${u.email !== "amministratore" ? `
            <button class="btn-blocca" data-email="${u.email}">Blocca</button>
            <button class="btn-sblocca" data-email="${u.email}">Sblocca</button>
            <button class="btn-elimina" data-email="${u.email}">Elimina</button>
          ` : ""}
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='14'>Errore caricamento utenti.</td></tr>";
  }
}

// ---------------------------------------------------------
// Listener per pulsanti Blocca / Sblocca / Elimina
// ---------------------------------------------------------
document.addEventListener("click", async (e) => {
  const email = e.target.dataset.email;
  if (!email) return;

  // BLOCCA
  if (e.target.classList.contains("btn-blocca")) {
    await adminGet("/api/admin/utenti/blocca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    caricaUtenti();
  }

  // SBLOCCA
  if (e.target.classList.contains("btn-sblocca")) {
    await adminGet("/api/admin/utenti/sblocca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    caricaUtenti();
  }

  // ELIMINA
  if (e.target.classList.contains("btn-elimina")) {
    if (!confirm("Eliminare definitivamente questo utente?")) return;

    await adminGet("/api/admin/utenti/elimina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    caricaUtenti();
  }
});
