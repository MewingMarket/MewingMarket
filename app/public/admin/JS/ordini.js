// =========================================================
// ORDINI ADMIN — Versione 2026.60 (compatibile loader-admin)
// =========================================================

// Sanitizzazione sicura
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
  console.log("[ADMIN] Caricamento ordini…");

  try {
    const data = await adminGet("/api/admin/ordini/lista");

    if (!data.success) {
      console.warn("[ADMIN] Nessun dato ordini:", data.error);
      return;
    }

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

    console.log("[ADMIN] Ordini caricati");

  } catch (err) {
    console.error("[ADMIN] Errore caricamento ordini:", err);
  }
}

// =========================================================
// INIT — Avvio solo dopo caricamento header/footer/head
// =========================================================
document.addEventListener("admin-header-loaded", caricaOrdini);
