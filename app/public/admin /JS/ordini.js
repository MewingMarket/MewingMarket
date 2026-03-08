// =========================================================
// ORDINI ADMIN – versione blindata
// =========================================================

// Sanitizzazione
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

// Wrapper fetch blindato
async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res.ok) throw new Error("Errore fetch admin: " + url);
  return res.json();
}

// =========================================================
// CARICA ORDINI
// =========================================================
async function caricaOrdini() {
  try {
    const data = await adminGet("/api/admin/ordini/lista");

    if (!data.success) return;

    // METRICHE
    document.getElementById("ordini-totali").textContent =
      clean(data.stats?.totali);

    document.getElementById("ordini-completati").textContent =
      clean(data.stats?.completati);

    document.getElementById("ordini-abbandonati").textContent =
      clean(data.stats?.abbandonati);

    // TABELLA ORDINI
    const tbody = document.querySelector("#tabella-ordini tbody");
    tbody.innerHTML = "";

    (data.ordini || []).forEach((o) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${clean(o.id)}</td>
        <td>${clean(o.prodotto)}</td>
        <td>${clean(o.prezzo)}€</td>
        <td>${clean(o.stato)}</td>
        <td>${clean(o.email)}</td>
        <td>${clean(o.origine)}</td>
        <td>${clean(o.data)}</td>
      `;
      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error("Errore caricamento ordini:", err);
  }
}

// =========================================================
// INIT
// =========================================================
document.addEventListener("DOMContentLoaded", caricaOrdini);
