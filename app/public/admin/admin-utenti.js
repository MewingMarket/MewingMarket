/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione 2027.100 — API UNIVERSALE
   - EVENTI COMPLETI + KPI + BREVO + FALLBACK
   - Sync Brevo + RegistratoBrevo + ClienteBrevo + ClienteDB
   - Colonna Bannato + KPI Bannati
   - Sync Utenti Storici
   Patch 2026.999 — fetchCritico + anti-HTML + anti-502
   Patch 2027.010 — ⭐ PATCH CREDENZIALI
   Patch 2027.100 — ⭐ API UNIVERSALE (apiFetch + alias)
========================================================= */

/* =========================================================
   fetchCritico — retry + anti-HTML + anti-502 + apiFetch
========================================================= */
async function fetchCritico(path, options = {}, cfg = {}) {
  const { retries = 3, backoff = 400 } = cfg;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const res = await apiFetch(path, options);
      const ct = res.headers.get("content-type") || "";

      if (ct.includes("text/html")) {
        const html = await res.text();
        throw new Error("HTML inatteso: " + html.slice(0, 200));
      }

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

/* =========================================================
   INIT
========================================================= */
document.addEventListener("admin-header-loaded", async () => {
  await syncBrevoAuto();
  caricaUtenti();
});

/* =========================================================
   FETCH ADMIN (patchato con fetchCritico + apiFetch)
========================================================= */
async function adminGet(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetchCritico(
    path,
    {
      ...options,
      headers
    }
  );

  return res.json();
}

/* =========================================================
   SYNC BREVO AUTOMATICA
========================================================= */
async function syncBrevoAuto() {
  try {
    await adminGet("/admin/utenti/sync-brevo");
    console.log("Sync Brevo OK");
  } catch (err) {
    console.warn("Sync Brevo fallita, fallback attivo");
  }
}

/* =========================================================
   SYNC BREVO MANUALE
========================================================= */
document.addEventListener("click", async (e) => {
  if (e.target.id === "btn-sync-brevo") {
    try {
      await adminGet("/admin/utenti/sync-brevo");
      alert("Sincronizzazione completata");
      caricaUtenti();
    } catch (err) {
      alert("Errore nella sincronizzazione Brevo");
    }
  }
});

/* =========================================================
   ⭐ PATCH — SYNC UTENTI STORICI
========================================================= */
document.addEventListener("click", async (e) => {
  if (e.target.id === "btn-sync-brevo-full") {
    if (!confirm("Sincronizzare tutti gli utenti storici in Brevo?")) return;

    try {
      await adminGet("/admin/utenti/sync-brevo-full");
      alert("Sincronizzazione utenti storici completata");
      caricaUtenti();
    } catch (err) {
      alert("Errore nella sincronizzazione utenti storici");
    }
  }
});

/* =========================================================
   Calcolo KPI
========================================================= */
function calcolaKPI(lista) {
  const tot = lista.length;

  return {
    totale: tot,
    registrati: lista.filter(u => u.registrato).length,
    login: lista.filter(u => u.login).length,
    logout: lista.filter(u => u.logout).length,
    eliminati: lista.filter(u => u.eliminato).length,
    bloccati: lista.filter(u => u.bloccato).length,
    sbloccati: lista.filter(u => u.sbloccato).length,
    bannati: lista.filter(u => u.__bannato === "sì").length,
    iscritto: lista.filter(u => u.iscritto).length,
    disiscritto: lista.filter(u => u.disiscritto).length,
    registratoBrevo: lista.filter(u => u.registrato_brevo === "presente").length,
    clienteBrevo: lista.filter(u => u.cliente_brevo === "presente").length,
    clienteDB: lista.filter(u => u.cliente_db === "sì").length
  };
}

/* =========================================================
   Stampa KPI
========================================================= */
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
    <div class="kpi-item"><b>Bannati:</b> ${kpi.bannati}</div>
    <div class="kpi-item"><b>Iscritti NL:</b> ${kpi.iscritto}</div>
    <div class="kpi-item"><b>Disiscritti NL:</b> ${kpi.disiscritto}</div>
    <div class="kpi-item"><b>Registrati in Brevo:</b> ${kpi.registratoBrevo}</div>
    <div class="kpi-item"><b>Clienti Brevo:</b> ${kpi.clienteBrevo}</div>
    <div class="kpi-item"><b>Clienti DB:</b> ${kpi.clienteDB}</div>
  `;
}

/* =========================================================
   Carica utenti + KPI + tabella
========================================================= */
async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='15'>Caricamento…</td></tr>";

  try {
    const data = await adminGet("/admin/utenti/lista");

    (data.utenti || []).forEach(u => {
      let bannato = "no";

      if (u.bloccato) {
        if (!u.sbloccato) {
          bannato = "sì";
        } else {
          const dBloc = new Date(u.bloccato);
          const dSbloc = new Date(u.sbloccato);
          if (dBloc > dSbloc) bannato = "sì";
        }
      }

      u.__bannato = bannato;
    });

    const kpi = calcolaKPI(data.utenti);
    stampaKPI(kpi);

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
        <td>${u.__bannato}</td>
        <td>${u.iscritto || ""}</td>
        <td>${u.disiscritto || ""}</td>
        <td>${u.registrato_brevo}</td>
        <td>${u.cliente_brevo}</td>
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
    tbody.innerHTML = "<tr><td colspan='15'>Errore caricamento utenti.</td></tr>";
  }
}

/* =========================================================
   Listener per pulsanti Blocca / Sblocca / Elimina
========================================================= */
document.addEventListener("click", async (e) => {
  const email = e.target.dataset.email;
  if (!email) return;

  // BLOCCA
  if (e.target.classList.contains("btn-blocca")) {
    await adminGet("/admin/utenti/blocca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    caricaUtenti();
  }

  // SBLOCCA
  if (e.target.classList.contains("btn-sblocca")) {
    await adminGet("/admin/utenti/sblocca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    caricaUtenti();
  }

  // ELIMINA
  if (e.target.classList.contains("btn-elimina")) {
    if (!confirm("Eliminare definitivamente questo utente?")) return;

    await adminGet("/admin/utenti/elimina", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    caricaUtenti();
  }
});
