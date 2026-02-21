// =========================================================
// File: app/public/admin/js/vendite.js
// Dashboard vendite (lettura da Airtable via backend)
// =========================================================

const boxTotaleVendite = document.getElementById("totale-vendite");
const boxTotaleRicavi = document.getElementById("totale-ricavi");
const boxNumeroOrdini = document.getElementById("numero-ordini");
const boxConversione = document.getElementById("conversione");

const tabella = document.querySelector("#tabella-vendite tbody");

// Messaggi
function setStatus(msg, ok = false) {
  const el = document.getElementById("status");
  if (!el) return;
  el.textContent = msg;
  el.style.color = ok ? "green" : "red";
}

// =========================================================
// 1. CARICA DATI VENDITE
// =========================================================

async function caricaVendite() {
  setStatus("Caricamento vendite...");

  try {
    const res = await fetch("/api/vendite/lista");
    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore caricamento vendite");
      return;
    }

    setStatus("");

    // =========================================================
    // 2. AGGIORNA STATISTICHE
    // =========================================================

    boxTotaleVendite.textContent = data.stats.totaleVendite;
    boxTotaleRicavi.textContent = data.stats.totaleRicavi.toFixed(2) + " €";
    boxNumeroOrdini.textContent = data.stats.numeroOrdini;
    boxConversione.textContent = data.stats.conversione + "%";

    // =========================================================
    // 3. RIEMPI TABELLA
    // =========================================================

    tabella.innerHTML = "";

    data.vendite.forEach(v => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${v.data}</td>
        <td>${v.prodotto}</td>
        <td>${v.prezzo} €</td>
        <td>${v.email}</td>
        <td>${v.metodo}</td>
      `;

      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// 4. AVVIO
// =========================================================

document.addEventListener("DOMContentLoaded", caricaVendite);
