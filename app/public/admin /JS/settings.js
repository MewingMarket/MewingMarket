// =========================================================
// SETTINGS ADMIN – versione blindata
// =========================================================

// Sanitizzazione
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Status box
const statusBox = document.getElementById("status");
function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// CARICA SETTINGS
// =========================================================

async function caricaSettings() {
  try {
    const res = await adminFetch("/api/admin/settings/get");
    const data = await res.json();

    if (!data.success) return;

    const s = data.settings;

    document.getElementById("admin-secret").value = clean(s.adminSecret);
    document.getElementById("airtable-base").value = clean(s.airtableBase);
    document.getElementById("airtable-sales").value = clean(s.airtableSales);
    document.getElementById("airtable-products").value = clean(s.airtableProducts);

  } catch (err) {
    console.error("Errore caricamento settings:", err);
  }
}

// =========================================================
// SALVA SETTINGS
// =========================================================

document.getElementById("btn-salva").addEventListener("click", async () => {
  setStatus("Salvataggio...");

  const body = {
    adminSecret: clean(document.getElementById("admin-secret").value),
    airtableBase: clean(document.getElementById("airtable-base").value),
    airtableSales: clean(document.getElementById("airtable-sales").value),
    airtableProducts: clean(document.getElementById("airtable-products").value)
  };

  try {
    const res = await adminFetch("/api/admin/settings/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();

    if (data.success) {
      setStatus("Impostazioni salvate", true);
    } else {
      setStatus(data.error || "Errore salvataggio");
    }

  } catch (err) {
    console.error("Errore salvataggio settings:", err);
    setStatus("Errore di connessione");
  }
});

// =========================================================
// INIT
// =========================================================

document.addEventListener("DOMContentLoaded", caricaSettings);
