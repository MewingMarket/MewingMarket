/* =========================================================
   ORDINI UTENTE — Versione 2026.96
   - Sicuro
   - Token Bearer
   - sessionState = 1
   - Annullamento ordine
   - Completa pagamento
   - Richiedi rimborso
   - UX migliorata
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");
  const body = document.getElementById("ordersBody");

  // =========================================================
  // 1) Protezione login
  // =========================================================
  if (!token || sessionState !== "1") {
    body.innerHTML = `<tr><td colspan="5">Devi effettuare il login.</td></tr>`;
    return;
  }

  // =========================================================
  // 2) Recupera ordini utente
  // =========================================================
  let data;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { Authorization: "Bearer " + token }
    });

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

  // =========================================================
  // 3) Render ordini
  // =========================================================
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

    // =========================================================
    // BOTTONI AZIONE (PATCH 2026.96)
    // =========================================================
    let azione = "";

    // 🔵 COMPLETA PAGAMENTO
    if (o.stato === "in_attesa_pagamento") {
      azione = `<button class="btn-paga" data-id="${o.id}">Completa pagamento</button>`;
    }

    // 🟢 RICHIEDI RIMBORSO (solo ordini completati)
    else if (o.stato === "completato") {
      azione = `<button class="btn-rimborso" data-id="${o.id}">Richiedi rimborso</button>`;
    }

    // 🔴 ANNULLA (solo se non completato e non annullato)
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

  // =========================================================
  // 4) Annulla ordine
  // =========================================================
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-annulla")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    if (!confirm("Vuoi annullare questo ordine?")) return;

    try {
      const res = await fetch(`/api/ordini/annulla/${id}`, {
        method: "POST",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json"
        }
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore annullamento.");
        return;
      }

      alert("Ordine annullato.");
      window.postMessage("refresh_dashboard");
      location.reload();

    } catch (err) {
      console.error("Errore annullamento ordine:", err);
      alert("Errore di connessione.");
    }
  });

  // =========================================================
  // 5) Completa pagamento (PayPal)
  // =========================================================
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-paga")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    try {
      const res = await fetch(`/api/paypal/ricrea/${id}`, {
        method: "POST",
        headers: { Authorization: "Bearer " + token }
      });

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

  // =========================================================
  // 6) Richiedi rimborso
  // =========================================================
  body.addEventListener("click", async e => {
    if (!e.target.classList.contains("btn-rimborso")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    // Redirect alla pagina rimborso
    window.location.href = `/rimborso.html?id=${id}`;
  });
});
