/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione definitiva 2026
========================================================= */

document.addEventListener("admin-header-loaded", caricaUtenti);

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore admin fetch: " + url);
  return res.json();
}

async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='4'>Caricamento…</td></tr>";

  try {
    const data = await adminGet("/api/admin/utenti/lista");

    tbody.innerHTML = "";

    (data.utenti || []).forEach(u => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${u.email}</td>
        <td>${u.newsletter ? "🟢" : "🔴"}</td>
        <td>${u.logged_in ? "🟢 Online" : "⚪ Offline"}</td>
        <td>
          <button class="btn-mini" data-email="${u.email}" data-blocco="${u.bloccato}">
            ${u.bloccato ? "Sblocca" : "Blocca"}
          </button>
        </td>
      `;

      tbody.appendChild(tr);
    });

    document.querySelectorAll(".btn-mini").forEach(btn => {
      btn.addEventListener("click", async () => {
        const email = btn.dataset.email;
        const stato = btn.dataset.blocco === "true";

        await toggleBlocco(email, !stato);
      });
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='4'>Errore caricamento utenti.</td></tr>";
  }
}

async function toggleBlocco(email, nuovoStato) {
  try {
    const res = await adminFetch("/api/admin/utenti/blocco", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, bloccato: nuovoStato })
    });

    const data = await res.json();

    if (data.success) {
      caricaUtenti();
    } else {
      alert(data.error || "Errore.");
    }

  } catch (err) {
    console.error(err);
    alert("Errore di connessione.");
  }
}
