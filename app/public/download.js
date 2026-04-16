/* =========================================================
   DOWNLOAD PREMIUM — Versione 2026.98
   - Solo ordini COMPLETATI
   - Sicuro
   - Token Bearer
   - sessionState = 1
   - Download via fetch + blob
   Patch 2026.999 — fetchCritico + anti-HTML + anti-502
   Patch 2027.010 — ⭐ PATCH CREDENZIALI (credentials: "include")
========================================================= */

/* =========================================================
   fetchCritico — retry + anti-HTML + anti-502
========================================================= */
async function fetchCritico(url, options = {}, cfg = {}) {
  const { retries = 3, backoff = 400 } = cfg;
  let attempt = 0;

  while (attempt <= retries) {
    try {
      const res = await fetch(url, options);
      const ct = res.headers.get("content-type") || "";

      if (ct.includes("text/html")) {
        const html = await res.text();
        throw new Error("HTML inatteso: " + html.slice(0, 200));
      }

      if (!res.ok) {
        if ([502, 503, 504].includes(res.status) && attempt < retries) {
          await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
          attempt++;
          continue;
        }
        throw new Error("HTTP " + res.status);
      }

      return res;

    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise(r => setTimeout(r, backoff * (attempt + 1)));
      attempt++;
    }
  }
}

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
    const res = await fetchCritico(
      "/api/ordini/utente",
      {
        headers: { Authorization: "Bearer " + token },
        credentials: "include"   // ⭐ PATCH
      },
      { retries: 3, backoff: 400 }
    );

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
  // 3) FILTRA SOLO ORDINI COMPLETATI
  // =========================================================
  const ordiniCompletati = data.ordini.filter(o => o.stato === "completato");

  if (ordiniCompletati.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto disponibile al download.</td></tr>`;
    return;
  }

  // =========================================================
  // 4) Estrai prodotti acquistati
  // =========================================================
  const prodotti = [];

  ordiniCompletati.forEach(o => {
    if (Array.isArray(o.prodotti)) {
      o.prodotti.forEach(p => {
        prodotti.push({
          prodotto_id: p.prodotto_id,
          titolo: p.titolo || p.titolo_breve || "Prodotto digitale",
          data: o.data_ordine || null
        });
      });
    }
  });

  if (prodotti.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun prodotto disponibile.</td></tr>`;
    return;
  }

  // =========================================================
  // 5) Deduplica prodotti
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
  // 6) Render tabella + download sicuro
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
  // 7) Download sicuro via fetch + blob
  // =========================================================
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-download")) return;

    const id = e.target.dataset.id;
    if (!id) return;

    try {
      const res = await fetchCritico(
        `/api/vendite/download/${id}`,
        {
          headers: { Authorization: "Bearer " + token },
          credentials: "include"   // ⭐ PATCH
        },
        { retries: 3, backoff: 400 }
      );

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `prodotto-${id}.pdf`;
      a.click();

      URL.revokeObjectURL(url);

      window.postMessage("refresh_dashboard");

    } catch (err) {
      console.error("Errore download:", err);
      alert("Errore di connessione.");
    }
  });
});
