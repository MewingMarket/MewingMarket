// =========================================================
// File: app/public/admin/js/ordini.js
// Gestione ordini e carrelli (lettura da Airtable via backend)
// =========================================================

const tabella = document.querySelector("#tabella-ordini tbody");
const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// 1. CARICA ORDINI
// =========================================================

async function caricaOrdini() {
  setStatus("Caricamento ordini...");

  try {
    const res = await fetch("/api/ordini/lista");
    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore caricamento ordini");
      return;
    }

    setStatus("");

    tabella.innerHTML = "";

    data.ordini.forEach(o => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${o.data}</td>
        <td>${o.email}</td>
        <td>${o.prodotto}</td>
        <td>${o.prezzo} €</td>
        <td>${o.stato}</td>
        <td>${o.metodo}</td>
      `;

      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// 2. AVVIO
// =========================================================

document.addEventListener("DOMContentLoaded", caricaOrdini);
