/* =========================================================
   ORDINI UTENTE — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  const body = document.getElementById("ordersBody");

  if (!body) return;

  /* =========================================================
     1) Protezione login
  ========================================================== */
  if (!token) {
    body.innerHTML = `<tr><td colspan="5">Effettua il login per vedere i tuoi ordini.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Recupera ordini utente (universal-json)
  ========================================================== */
  const data = await apiOrdini("/api/ordini/getOrdiniUtente", {
    method: "GET"
  });

  if (!data || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato nel database.</td></tr>`;
    return;
  }

  body.innerHTML = "";

  /* =========================================================
     3) Render ordini
  ========================================================== */
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    let prodottiHTML = "-";
    try {
      const prodottiArray = typeof o.prodotti_json === "string"
        ? JSON.parse(o.prodotti_json)
        : (o.prodotti || []);

      if (Array.isArray(prodottiArray)) {
        prodottiHTML = prodottiArray
          .map(p => {
            const prezzo = (p.prezzo_cent / 100).toFixed(2);
            return `<b>${p.titolo || "Ebook"}</b> <br><small>${prezzo}€</small>`;
          })
          .join("<hr style='margin:5px 0; border:0; border-top:1px solid #eee;'>");
      }
    } catch (e) {
      console.error("Errore parse prodotti_json:", e);
    }

    const totaleEuro = (o.totale_cent / 100).toFixed(2);
    const dataOrdine = o.data_ordine || o.created_at
      ? new Date(o.data_ordine || o.created_at).toLocaleDateString("it-IT")
      : "—";

    const stato = o.stato ? o.stato.toLowerCase() : "in_attesa";

    let azione = "";
    if (stato === "pagato" || stato === "completato") {
      azione = `
        <button class="btn-download-diretto" onclick="location.href='/download.html'">Vai ai Download</button>
        <button class="btn-rimborso-link" onclick="location.href='/rimborso.html?id=${o.id}'">Assistenza</button>
      `;
    } else if (stato === "in_attesa_pagamento" || stato === "creato") {
      azione = `
        <button class="btn-paga" data-id="${o.id}">Paga Ora</button>
        <button class="btn-annulla" data-id="${o.id}">Annulla</button>
      `;
    } else if (stato === "rimborsato") {
      azione = `<span class="badge rimborsato">Rimborsato</span>`;
    } else {
      azione = `<span class="badge">${stato}</span>`;
    }

    tr.innerHTML = `
      <td>${dataOrdine}</td>
      <td>${prodottiHTML}</td>
      <td>${totaleEuro}€</td>
      <td><span class="stato-${stato}">${stato.toUpperCase()}</span></td>
      <td>${azione}</td>
    `;

    body.appendChild(tr);
  });

  /* =========================================================
     5) Delegazione Eventi
  ========================================================== */
  body.addEventListener("click", async e => {
    const id = e.target.dataset.id;
    if (!id) return;

    /* ------------------------------
       ANNULLA ORDINE
    ------------------------------ */
    if (e.target.classList.contains("btn-annulla")) {
      if (!confirm("Vuoi annullare l'ordine?")) return;

      const res = await apiOrdini(`/api/ordini/annullaOrdine/${id}`, {
        method: "POST"
      });

      if (res) location.reload();
      else alert("Errore durante l'annullamento.");
    }

    /* ------------------------------
       COMPLETA PAGAMENTO (PayPal)
    ------------------------------ */
    if (e.target.classList.contains("btn-paga")) {
      const res = await apiOrdini(`/api/paypal/paypalRicrea/${id}`, {
        method: "POST"
      });

      if (res && res.url) window.location.href = res.url;
      else alert("Impossibile rigenerare il pagamento.");
    }
  });
});

/* =========================================================
   WRAPPER UNIVERSALE JSON
========================================================= */
async function apiOrdini(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
