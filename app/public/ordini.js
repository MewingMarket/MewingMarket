/* =========================================================
   ORDINI UTENTE — Versione SQL Sincronizzata 2027.990
   PATCH: Token + Gestione 401/403 + Coerenza Sistema
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
     2) Recupera ordini utente
  ========================================================== */
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { Authorization: "Bearer " + token }
    });

    // Token scaduto → logout
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return;
    }

    const data = await res.json();

    if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
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

  } catch (err) {
    console.error("Errore caricamento ordini:", err);
    body.innerHTML = `<tr><td colspan="5">Errore tecnico durante il recupero degli ordini.</td></tr>`;
  }

  /* =========================================================
     5) Delegazione Eventi
  ========================================================== */
  body.addEventListener("click", async e => {
    const id = e.target.dataset.id;
    if (!id) return;

    // ANNULLA ORDINE
    if (e.target.classList.contains("btn-annulla")) {
      if (!confirm("Vuoi annullare l'ordine?")) return;

      try {
        const res = await fetch(`/api/ordini/annulla/${id}`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        const resData = await res.json();
        if (resData.success) location.reload();
      } catch (err) {
        alert("Errore di connessione.");
      }
    }

    // COMPLETA PAGAMENTO (PayPal)
    if (e.target.classList.contains("btn-paga")) {
      try {
        const res = await fetch(`/api/paypal/ricrea/${id}`, {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        });

        if (res.status === 401 || res.status === 403) {
          localStorage.removeItem("token");
          window.location.href = "/login";
          return;
        }

        const resData = await res.json();
        if (resData.success && resData.url) window.location.href = resData.url;
        else alert("Impossibile rigenerare il pagamento.");
      } catch (err) {
        alert("Errore di connessione.");
      }
    }
  });
});
