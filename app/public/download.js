/* =========================================================
   DOWNLOAD PREMIUM — Versione 2026.95
   - Sicuro
   - Token Bearer
   - sessionState = 1
   - Download via fetch + blob
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const sessionState = localStorage.getItem("sessionState");

  const body = document.getElementById("downloadBody");

  // =========================================================
  // 1) Protezione login
  // =========================================================
  if (!token || sessionState !== "1") {
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login.</td></tr>`;
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
    body.innerHTML = `<tr><td colspan="3">Errore di connessione.</td></tr>`;
    return;
  }

  if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto acquistato.</td></tr>`;
    return;
  }

  // =========================================================
  // 3) Estrai prodotti acquistati
  // =========================================================
  const prodotti = [];

  data.ordini.forEach(o => {
    if (Array.isArray(o.prodotti)) {
      o.prodotti.forEach(p => {
        prodotti.push({
          prodotto_id: p.prodotto_id,
          titolo: p.titolo || p.titolo_breve || "Prodotto digitale",
          data: o.data_ordine || o.data || null
        });
      });
    }
  });

  if (prodotti.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto disponibile.</td></tr>`;
    return;
  }

  // =========================================================
  // 4) Deduplica prodotti
  // =========================================================
  const unici = [];
  const visti = new Set();

  prodotti.forEach(p => {
    if (!visti.has(p.prodotto_id)) {
      visti.add(p.prodotto_id);
      unici.push(p);
    }
  });

  // =========================================================
  // 5) Render tabella + download sicuro
  // =========================================================
  unici.forEach(p => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${p.titolo}</td>
      <td>${p.data ? new Date(p.data).toLocaleDateString("it-IT") : "—"}</td>
      <td><button class="btn-download" data-id="${p.prodotto_id}">Scarica</button></td>
    `;

    body.appendChild(tr);
  });

  // =========================================================
  // 6) Download sicuro via fetch + blob
  // =========================================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-download")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    try {
      const res = await fetch(`/api/vendite/download/${id}`, {
        headers: { Authorization: "Bearer " + token }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Errore durante il download.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `prodotto-${id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);

      // PATCH refresh dashboard
      window.postMessage("refresh_dashboard");

    } catch (err) {
      console.error("Errore download:", err);
      alert("Errore di connessione.");
    }
  });
});
