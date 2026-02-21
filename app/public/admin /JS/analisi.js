// =========================================================
// File: app/public/admin/js/analisi.js
// Analisi performance (traffico + conversioni)
// =========================================================

const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  if (!statusBox) return;
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

async function caricaAnalisi() {
  setStatus("Caricamento analisi...");

  try {
    const res = await fetch("/api/analisi/dati");
    const data = await res.json();

    if (!data.success) {
      setStatus(data.error || "Errore caricamento analisi");
      return;
    }

    setStatus("");

    // Panoramica
    document.getElementById("conv-rate").textContent = data.stats.conversione + "%";
    document.getElementById("traffico-totale").textContent = data.stats.traffico;
    document.getElementById("ctr-medio").textContent = data.stats.ctr + "%";

    // Tabelle
    riempiTabella("tabella-analisi-prodotti", data.prodotti);
    riempiTabella("tabella-traffico", data.traffico);
    riempiTabella("tabella-utm", data.utm);

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

function riempiTabella(id, righe) {
  const tbody = document.querySelector(`#${id} tbody`);
  tbody.innerHTML = "";

  righe.forEach(r => {
    const tr = document.createElement("tr");
    tr.innerHTML = Object.values(r).map(v => `<td>${v}</td>`).join("");
    tbody.appendChild(tr);
  });
}

document.addEventListener("DOMContentLoaded", caricaAnalisi);
