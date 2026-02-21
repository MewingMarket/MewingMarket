// =========================================================
// File: app/public/admin/js/settings.js
// Gestione impostazioni admin
// =========================================================

const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// Carica impostazioni
async function caricaSettings() {
  const res = await fetch("/api/settings/get");
  const data = await res.json();

  if (!data.success) return;

  document.getElementById("admin-secret").value = data.settings.adminSecret;
  document.getElementById("airtable-base").value = data.settings.airtableBase;
  document.getElementById("airtable-sales").value = data.settings.airtableSales;
  document.getElementById("airtable-products").value = data.settings.airtableProducts;
}

// Salva impostazioni
document.getElementById("btn-salva").addEventListener("click", async () => {
  setStatus("Salvataggio...");

  const body = {
    adminSecret: document.getElementById("admin-secret").value.trim(),
    airtableBase: document.getElementById("airtable-base").value.trim(),
    airtableSales: document.getElementById("airtable-sales").value.trim(),
    airtableProducts: document.getElementById("airtable-products").value.trim()
  };

  const res = await fetch("/api/settings/save", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.success) {
    setStatus("Impostazioni salvate", true);
  } else {
    setStatus(data.error || "Errore salvataggio");
  }
});

document.addEventListener("DOMContentLoaded", caricaSettings);
