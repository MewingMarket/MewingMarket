// =========================================================
// File: app/public/admin/js/prodotti.js
// Lista prodotti
// =========================================================

const tabella = document.querySelector("#tabella-prodotti tbody");
const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

async function caricaProdotti() {
  setStatus("Caricamento prodotti...");

  try {
    const res = await fetch("/api/prodotti/lista");
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
        <td>${p.titolo}</td>
        <td>${p.prezzo} €</td>
        <td>${p.categoria}</td>
        <td>
          <a href="/admin/prodotto-edit.html?id=${p.id}" class="btn-small">Modifica</a>
        </td>
      `;

      tabella.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

document.addEventListener("DOMContentLoaded", caricaProdotti);
