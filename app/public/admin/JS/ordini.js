// =========================================================
// ORDINI ADMIN — Versione 2026.90 (compatibile loader-admin)
// =========================================================

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

/* =========================================================
   adminFetch — identico a dashboard-admin.js
========================================================= */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const ruolo = localStorage.getItem("ruolo");

  if (!token || ruolo !== "admin") {
    console.warn("[ADMIN] Accesso negato → non admin");
    window.location.href = "/login.html?redirect=admin/dashboard-admin-ordini.html";
    return;
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    console.warn("[ADMIN] Token non valido → logout");

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");

    window.location.href = "/login.html";
    return;
  }

  return res;
}

/* =========================================================
   Wrapper GET
========================================================= */
async function adminGet(url) {
  const res = await adminFetch(url);
  if (!res) return null;
  return res.json();
}

/* =========================================================
   CARICA ORDINI
========================================================= */
async function caricaOrdini() {
  console.log("[ADMIN] Caricamento ordini…");

  try {
    // PATCH: endpoint corretto
    const data = await adminGet("/api/admin/ordini");

    if (!data || !data.success) {
      console.warn("[ADMIN] Nessun dato ordini:", data?.error);
      return;
    }

    const ordini = data.ordini || [];

    // PATCH: metriche calcolate lato frontend
    const totali = ordini.length;
    const completati = ordini.filter(o => o.stato === "completato").length;
    const annullati = ordini.filter(o => o.stato === "annullato").length;

    document.getElementById("ordini-totali").textContent = totali;
    document.getElementById("ordini-completati").textContent = completati;
    document.getElementById("ordini-abbandonati").textContent = annullati;

    // TABELLA ORDINI
    const tbody = document.querySelector("#tabella-ordini tbody");
    tbody.innerHTML = "";

    ordini.forEach((o) => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${clean(o.id)}</td>
        <td>${clean(o.utente_id)}</td>
        <td>${(o.totale_cent / 100).toFixed(2)} €</td>
        <td>${clean(o.stato)}</td>
        <td>${clean(o.metodo_pagamento || "")}</td>
        <td>${clean(o.data_ordine || "")}</td>
      `;

      tbody.appendChild(tr);
    });

    console.log("[ADMIN] Ordini caricati");

  } catch (err) {
    console.error("[ADMIN] Errore caricamento ordini:", err);
  }
}

/* =========================================================
   INIT — Avvio solo dopo caricamento header/footer/head
========================================================= */
document.addEventListener("admin-header-loaded", caricaOrdini);
