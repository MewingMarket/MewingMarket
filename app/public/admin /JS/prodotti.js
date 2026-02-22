// =========================================================
// File: app/public/admin/js/prodotti.js
// Lista prodotti (versione Airtable)
// =========================================================

const tabella = document.querySelector("#tabella-prodotti tbody");
const statusBox = document.getElementById("status");
const btnSync = document.getElementById("btn-sync");

function setStatus(msg, ok = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// CARICA LISTA PRODOTTI
// =========================================================
async function caricaProdotti() {
  setStatus("Caricamento prodotti...");

  try {
    const res = await fetch("/api/products");
    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore caricamento prodotti");
      return;
    }

    setStatus("");

    tabella.innerHTML = "";

    data.prodotti.forEach(p => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${p.titolo || ""}</td>
        <td>${p.prezzo || 0} €</td>
        <td>${p.categoria || "-"}</td>
        <td>${p.slug || ""}</td>
        <td>${p.stato || "-"}</td>
        <td>
          <a href="/admin/prodotto-edit.html?slug=${p.slug}" class="btn-small">Modifica</a>
        </td>
      `;

      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// SYNC MANUALE DA AIRTABLE
// =========================================================
btnSync.addEventListener("click", async () => {
  setStatus("Sincronizzazione in corso...");

  try {
    const res = await fetch("/api/products/sync", { method: "POST" });
    const data = await res.json();

    if (!data.success) {
      setStatus("Errore sincronizzazione");
      return;
    }

    setStatus("Catalogo aggiornato!", true);
    caricaProdotti();

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
});

// =========================================================
// AVVIO
// =========================================================
document.addEventListener("DOMContentLoaded", caricaProdotti);
