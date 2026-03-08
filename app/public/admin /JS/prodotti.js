// =========================================================
// GESTIONE PRODOTTI – versione blindata
// =========================================================

// Sanitizzazione
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Elementi DOM
const tabella = document.querySelector("#tabella-prodotti tbody");
const statusBox = document.getElementById("status");
const btnSync = document.getElementById("btn-sync");

// Status
function setStatus(msg, ok = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// FETCH BLINDATO
// =========================================================

async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore fetch admin: " + url);
  return res.json();
}

// =========================================================
// 1. CARICA LISTA PRODOTTI
// =========================================================

async function caricaProdotti() {
  setStatus("Caricamento prodotti...");

  try {
    const data = await adminGet("/api/admin/prodotti/lista");

    if (!data.success) {
      setStatus(data.error || "Errore caricamento prodotti");
      return;
    }

    setStatus("");

    tabella.innerHTML = "";

    (data.prodotti || []).forEach((p) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${clean(p.titolo)}</td>
        <td>${clean(String(p.prezzo))} €</td>
        <td>${clean(p.categoria || "-")}</td>
        <td>${clean(p.slug)}</td>
        <td>${clean(p.stato || "OK")}</td>
        <td>
          <a href="/admin/prodotto-edit.html?slug=${clean(p.slug)}" class="btn-small">
            Modifica
          </a>
        </td>
      `;

      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore caricamento prodotti:", err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// 2. SYNC MANUALE DA AIRTABLE
// =========================================================

btnSync.addEventListener("click", async () => {
  setStatus("Sincronizzazione in corso...");

  try {
    const res = await adminFetch("/api/admin/prodotti/sync", {
      method: "POST"
    });

    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore sincronizzazione");
      return;
    }

    setStatus("Catalogo aggiornato!", true);
    caricaProdotti();

  } catch (err) {
    console.error("Errore sync prodotti:", err);
    setStatus("Errore di connessione");
  }
});

// =========================================================
// INIT
// =========================================================

document.addEventListener("DOMContentLoaded", caricaProdotti);
