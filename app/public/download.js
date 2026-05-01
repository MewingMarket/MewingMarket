/* =========================================================
   DOWNLOAD PREMIUM — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  const body = document.getElementById("downloadBody");

  if (!body) return;

  /* =========================================================
     1) Protezione login
  ========================================================== */
  if (!token) {
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login per accedere ai tuoi file.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Recupera ordini utente (universal-json)
  ========================================================== */
  const data = await apiDownload("/api/ordini/getOrdiniUtente", {
    method: "GET"
  });

  if (!data || !Array.isArray(data.ordini)) {
    body.innerHTML = `<tr><td colspan="3">Nessun ordine trovato nel tuo account.</td></tr>`;
    return;
  }

  /* =========================================================
     3) Filtra ordini pagati
  ========================================================== */
  const ordiniValidi = data.ordini.filter(
    (o) => o.stato === "pagato" || o.stato === "completato"
  );

  if (ordiniValidi.length === 0) {
    body.innerHTML = `<tr><td colspan="3">I tuoi ordini sono in attesa di conferma o annullati.</td></tr>`;
    return;
  }

  /* =========================================================
     4) Estrai prodotti_json
  ========================================================== */
  const listaProdotti = [];

  ordiniValidi.forEach((o) => {
    try {
      const prodottiAcquistati =
        typeof o.prodotti_json === "string"
          ? JSON.parse(o.prodotti_json)
          : o.prodotti || [];

      if (Array.isArray(prodottiAcquistati)) {
        prodottiAcquistati.forEach((p) => {
          listaProdotti.push({
            prodotto_id: p.prodotto_id,
            titolo: p.titolo || "Prodotto Digitale",
            data: o.data_ordine || o.created_at || null
          });
        });
      }
    } catch (e) {
      console.error("❌ Errore parsing prodotti_json per ordine:", o.id);
    }
  });

  /* =========================================================
     5) Deduplica
  ========================================================== */
  const unici = [];
  const visti = new Set();

  listaProdotti.forEach((p) => {
    if (!visti.has(p.prodotto_id)) {
      visti.add(p.prodotto_id);
      unici.push(p);
    }
  });

  if (unici.length === 0) {
    body.innerHTML = `<tr><td colspan="3">Nessun file disponibile per il download.</td></tr>`;
    return;
  }

  /* =========================================================
     6) Render tabella
  ========================================================== */
  body.innerHTML = "";
  unici.forEach((p) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><b>${p.titolo}</b></td>
      <td><small>${p.data ? new Date(p.data).toLocaleDateString("it-IT") : "—"}</small></td>
      <td><button class="btn-download" data-id="${p.prodotto_id}">Scarica PDF</button></td>
    `;
    body.appendChild(tr);
  });

  /* =========================================================
     7) Download Sicuro (Blob)
  ========================================================== */
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-download")) return;

    const btn = e.target;
    const id = btn.dataset.id;
    const originalText = btn.textContent;

    try {
      btn.textContent = "Preparazione...";
      btn.disabled = true;

      const blob = await apiDownloadBlob(`/api/vendite/downloadFile/${id}`);

      if (!blob) throw new Error("Download fallito");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `MewingMarket_Prodotto_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      btn.textContent = "Completato!";
    } catch (err) {
      console.error("❌ Download fallito:", err);
      alert("Non è stato possibile scaricare il file. Verifica di aver completato il pagamento.");
    } finally {
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
});

/* =========================================================
   WRAPPER UNIVERSALE JSON
========================================================= */
async function apiDownload(path, options = {}) {
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

/* =========================================================
   WRAPPER UNIVERSALE BLOB (download file)
========================================================= */
async function apiDownloadBlob(path) {
  const token = localStorage.getItem("token");

  let res;
  try {
    res = await fetch(path, {
      headers: { Authorization: "Bearer " + token }
    });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }

  if (!res.ok) return null;

  try {
    return await res.blob();
  } catch (e) {
    console.error("❌ Errore lettura blob:", e);
    return null;
  }
}
