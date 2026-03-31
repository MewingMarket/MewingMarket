// =========================================================
// ORDINI ADMIN — Versione 2026.95 (compatibile loader-admin)
// Compatibile con la TABELLA HTML che hai fornito
// =========================================================

// Sanitizzazione sicura
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : t ?? "";

/* =========================================================
   adminFetch — identico agli altri file admin
========================================================= */
async function adminFetch(url, options = {}) {
  const token = localStorage.getItem("token");
  const ruolo = localStorage.getItem("ruolo");

  if (!token || ruolo !== "admin") {
    window.location.href = "/login.html?redirect=admin/ordini.html";
    return;
  }

  const headers = {
    ...(options.headers || {}),
    Authorization: `Bearer ${token}`
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.clear();
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
    // Endpoint corretto
    const data = await adminGet("/api/admin/ordini");

    if (!data || !data.success) {
      console.warn("[ADMIN] Nessun dato ordini:", data?.error);
      return;
    }

    const ordini = data.ordini || [];

    // METRICHE
    const totali = ordini.length;
    const completati = ordini.filter(o => o.stato === "completato").length;
    const abbandonati = ordini.filter(o => o.stato === "annullato").length;

    document.getElementById("ordini-totali").textContent = totali;
    document.getElementById("ordini-completati").textContent = completati;
    document.getElementById("ordini-abbandonati").textContent = abbandonati;

    // TABELLA
    const tbody = document.querySelector("#tabella-ordini tbody");
    tbody.innerHTML = "";

    for (const o of ordini) {
      // Estrai primo prodotto dal JSON
      let prodotto = "—";
      let prezzo = (o.totale_cent / 100).toFixed(2) + " €";

      try {
        const arr = JSON.parse(o.prodotti_json);
        if (arr.length > 0) {
          prodotto = arr[0].titolo || arr[0].titolo_breve || "Prodotto digitale";
        }
      } catch {}

      // Recupera email utente
      let email = "—";
      try {
        const resUser = await adminFetch(`/api/utenti/${o.utente_id}`);
        const userData = await resUser.json();
        if (userData.success) email = userData.email;
      } catch {}

      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${clean(o.id)}</td>
        <td>${clean(prodotto)}</td>
        <td>${clean(prezzo)}</td>
        <td>${clean(o.stato)}</td>
        <td>${clean(email)}</td>
        <td>${clean(o.metodo_pagamento || "—")}</td>
        <td>${clean(o.data_ordine || "—")}</td>
      `;

      tbody.appendChild(tr);
    }

    console.log("[ADMIN] Ordini caricati");

  } catch (err) {
    console.error("[ADMIN] Errore caricamento ordini:", err);
  }
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("admin-header-loaded", caricaOrdini);
