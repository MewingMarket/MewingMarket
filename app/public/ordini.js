/* =========================================================
   ORDINI UTENTE — Versione 2027.503 SAFE MODE
   - Compatibile cookie di sessione
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
========================================================= */

console.log("📌 [ORDINI 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [ORDINI 2058] pageInit() avviata");
  avviaOrdiniUtente();
};

/* =========================================================
   LOGICA ORDINI
========================================================= */
async function avviaOrdiniUtente() {
  console.log("🔥 ordini.js READY");

  const body = document.getElementById("ordersBody");
  if (!body) return;

  /* =========================================================
     1) Verifica login tramite /me
  ========================================================== */
  console.log("🌐 [ORDINI] Verifica sessione…");

  const me = await apiOrdini("/api/utenti/me", { method: "POST" });

  if (!me || me.guest) {
    body.innerHTML = `<tr><td colspan="5">Effettua il login per vedere i tuoi ordini.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Recupera ordini utente
  ========================================================== */
  console.log("🌐 [ORDINI] Recupero ordini utente…");

  const res = await apiOrdini("/api/ordini/getOrdiniUtente", {
    method: "GET"
  });

  if (!res || !res.success || !Array.isArray(res.ordini) || res.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="5">Nessun ordine trovato.</td></tr>`;
    return;
  }

  const ordini = res.ordini;
  body.innerHTML = "";

  /* =========================================================
     3) Render ordini
  ========================================================== */
  ordini.forEach(o => {
    const tr = document.createElement("tr");

    let prodottiHTML = "-";
    try {
      const prodottiArray = JSON.parse(o.prodotti_json || "[]");

      prodottiHTML = prodottiArray
        .map(p => {
          const prezzo = (p.prezzo_cent / 100).toFixed(2);
          return `<b>${p.titolo}</b><br><small>${prezzo}€</small>`;
        })
        .join("<hr>");
    } catch (e) {
      console.error("❌ parse prodotti_json:", e);
    }

    const totaleEuro = (o.totale_cent / 100).toFixed(2);
    const dataOrdine = new Date(o.data_ordine).toLocaleDateString("it-IT");
    const stato = o.stato.toLowerCase();

    let azione = "";

    if (stato === "completato") {
      azione = `
        <button class="btn-download" onclick="location.href='download.html'">Download</button>
        <button class="btn-rimborso" onclick="location.href='rimborso.html?id=${o.id}'">Assistenza</button>
      `;
    } else if (stato === "in_attesa_pagamento") {
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
     4) Delegazione Eventi
  ========================================================== */
  body.addEventListener("click", async e => {
    const id = e.target.dataset.id;
    if (!id) return;

    /* ------------------------------
       ANNULLA ORDINE
    ------------------------------ */
    if (e.target.classList.contains("btn-annulla")) {
      if (!confirm("Vuoi annullare l'ordine?")) return;

      const res = await apiOrdini("/api/ordini/annullaOrdine", {
        method: "POST",
        body: JSON.stringify({ id })
      });

      if (res && res.success) location.reload();
      else alert(res.error || "Errore durante l'annullamento.");
    }

    /* ------------------------------
       COMPLETA PAGAMENTO (PayPal)
    ------------------------------ */
    if (e.target.classList.contains("btn-paga")) {
      const res = await apiOrdini("/api/paypal/ricreaPagamento", {
        method: "POST",
        body: JSON.stringify({ id })
      });

      if (res && res.success && res.url) window.location.href = res.url;
      else alert("Impossibile rigenerare il pagamento.");
    }
  });
}

/* =========================================================
   WRAPPER UNIVERSALE JSON (SAFE MODE)
========================================================= */
async function apiOrdini(path, options = {}) {
  try {
    const res = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });

    const json = await res.json().catch(() => null);
    return json || { success: false };

  } catch (err) {
    console.error("❌ [ORDINI] Errore rete:", err);
    return { success: false };
  }
}
