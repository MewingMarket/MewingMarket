/* =========================================================
   ORDINI UTENTE — Versione 2027.300 (patch totale)
   - Usa fetchCritico globale + API alias
   - Nessuna regressione
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");
  const body = document.getElementById("ordersBody");

  /* =========================================================
     1) Protezione login
  ========================================================== */
  if (!token || sessionState !== "1") {
    body.innerHTML = `<tr><td colspan="5">Devi effettuare il login.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Recupera ordini utente (alias /ordini/utente)
  ========================================================== */
  let data;
  try {
    const res = await window.fetchCritico(
      "/ordini/utente",
      {
        headers: { Authorization: "Bearer " + token }
      },
      { retries: 3, backoffMs: 400 }
    );

    data = await res.json();

  } catch (err) {
    console.error("Errore fetch /ordini/utente:", err);
    body.innerHTML = `<tr><td colspan="5">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  /* =========================================================
     3) Render ordini
  ========================================================== */
  data.ordini.forEach(o => {
    const tr = document.createElement("tr");

    const prodottiHTML = Array.isArray(o.prodotti)
      ? o.prodotti
          .map(p => {
            const prezzo = (p.prezzo_cent / 100).toFixed(2);
            const titolo = p.titolo || p.titolo_breve || "Prodotto digitale";
            return `${titolo} (${prezzo}€ × ${p.qty || 1})`;
          })
          .join("<br>")
      : "-";

    const totaleEuro = (o.totale_cent / 100).toFixed(2);
    const dataOrdine = o.data_ordine
      ? new Date(o.data_ordine).toLocaleDateString("it-IT")
      : "—";

    let azione = "";

    if (o.stato === "in_attesa_pagamento") {
      azione = `<button class="btn-paga" data-id="${o.id}">Completa pagamento</button>`;
    }
    else if (o.stato === "completato") {
      const downloadBtn = o.download_token
        ? `<button class="btn-download" data-token="${o.download_token}">Download</button>`
        : "";

      azione = `
        ${downloadBtn}
        <button class="btn-rimborso" data-id="${o.id}">Richiedi rimborso</button>
      `;
    }
    else if (o.stato === "rimborsato") {
      azione = `<span class="badge-rimborsato">Rimborsato</span>`;
    }
    else if (o.stato !== "annullato") {
      azione = `<button class="btn-annulla" data-id="${o.id}">Annulla</button>`;
    }

    tr.innerHTML = `
      <td>${dataOrdine}</td>
      <td>${prodottiHTML}</td>
      <td>${totaleEuro}€</td>
      <td>${o.stato}</td>
      <td>${azione}</td>
    `;

    body.appendChild(tr);
  });

  /* =========================================================
     4) Annulla ordine
  ========================================================== */
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-annulla")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    if (!confirm("Vuoi annullare questo ordine?")) return;

    try {
      const res = await window.fetchCritico(
        `/ordini/annulla/${id}`,
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json"
          }
        },
        { retries: 3, backoffMs: 400 }
      );

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore annullamento.");
        return;
      }

      alert("Ordine annullato.");
      location.reload();

    } catch (err) {
      console.error("Errore annullamento ordine:", err);
      alert("Errore di connessione.");
    }
  });

  /* =========================================================
     5) Completa pagamento (PayPal)
  ========================================================== */
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-paga")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    try {
      const res = await window.fetchCritico(
        `/paypal/ricrea/${id}`,
        {
          method: "POST",
          headers: { Authorization: "Bearer " + token }
        },
        { retries: 3, backoffMs: 400 }
      );

      const data = await res.json();

      if (!data.success || !data.url) {
        alert("Errore nella rigenerazione del pagamento.");
        return;
      }

      window.location.href = data.url;

    } catch (err) {
      console.error("Errore completa pagamento:", err);
      alert("Errore di connessione.");
    }
  });

  /* =========================================================
     6) Richiedi rimborso
  ========================================================== */
  body.addEventListener("click", e => {
    if (!e.target.classList.contains("btn-rimborso")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    window.location.href = `/rimborso.html?id=${id}`;
  });

  /* =========================================================
     7) Download file
  ========================================================== */
  body.addEventListener("click", e => {
    if (!e.target.classList.contains("btn-download")) return;

    const token = e.target.dataset.token;
    if (!token) return;

    window.location.href = `/download/${token}`;
  });
});
