// =========================================================
// File: app/public/admin/js/feedback.js
// Gestione recensioni utenti
// =========================================================

const tabella = document.querySelector("#tabella-feedback tbody");
const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// 1. CARICA FEEDBACK
// =========================================================

async function caricaFeedback() {
  setStatus("Caricamento feedback...");

  try {
    const res = await fetch("/api/feedback/lista");
    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore caricamento feedback");
      return;
    }

    setStatus("");

    tabella.innerHTML = "";

    data.feedback.forEach(f => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${f.data}</td>
        <td>${f.email}</td>
        <td>${f.prodotto}</td>
        <td>${f.voto} ⭐</td>
        <td>${f.commento}</td>
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

document.addEventListener("DOMContentLoaded", caricaFeedback);
