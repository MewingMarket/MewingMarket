/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione 2026 — PATCH EVENTI COMPLETI
========================================================= */

document.addEventListener("admin-header-loaded", caricaUtenti);

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore admin fetch: " + url);
  return res.json();
}

async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='10'>Caricamento…</td></tr>";

  try {
    const data = await adminGet("/api/admin/utenti/lista");

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
