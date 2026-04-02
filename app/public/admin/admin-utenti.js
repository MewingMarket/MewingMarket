/* =========================================================
   File: app/public/admin/admin-utenti.js
   Admin — Gestione Utenti
   Versione definitiva 2026 + PATCH EVENTI UTENTE (STAMPA FISSA)
========================================================= */

document.addEventListener("admin-header-loaded", caricaUtenti);

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore admin fetch: " + url);
  return res.json();
}

// ---------------------------------------------------------
// PATCH — Carica eventi utente da user-events.json
// ---------------------------------------------------------
async function getUserEvents(email) {
  try {
    const res = await fetch("/data/user-events.json");
    const all = await res.json();
    return all.filter(ev => ev.email === email);
  } catch (err) {
    console.error("Errore caricamento eventi:", err);
    return [];
  }
}

// ---------------------------------------------------------
// Carica utenti + stampa eventi fissi
// ---------------------------------------------------------
async function caricaUtenti() {
  const tbody = document.querySelector("#tabella-utenti tbody");
  tbody.innerHTML = "<tr><td colspan='5'>Caricamento…</td></tr>";

  try {
    const data = await adminGet("/api/admin/utenti/lista");

    tbody.innerHTML = "";

    for (const u of data.utenti || []) {
      const eventi = await getUserEvents(u.email);

      const eventiHTML = eventi.length
        ? eventi
            .map(ev => `<div><b>${ev.evento}</b> — <small>${ev.data}</small></div>`)
            .join("")
        : "<small>Nessun evento</small>";

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
        <td class="col-eventi">
          ${eventiHTML}
        </td>
      `;

      tbody.appendChild(tr);
    }

    // -----------------------------------------------------
    // PATCH — Bottone blocco/sblocco
    // -----------------------------------------------------
    document.querySelectorAll(".btn-mini[data-blocco]").forEach(btn => {
      btn.addEventListener("click", async () => {
        const email = btn.dataset.email;
        const stato = btn.dataset.blocco === "true";

        await toggleBlocco(email, !stato);
      });
    });

  } catch (err) {
    console.error(err);
    tbody.innerHTML = "<tr><td colspan='5'>Errore caricamento utenti.</td></tr>";
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
