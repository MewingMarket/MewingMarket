/* =========================================================
   DOWNLOAD PREMIUM — Versione 2027.503 SAFE MODE
   - Compatibile con cookie di sessione
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
========================================================= */

console.log("📌 [DOWNLOAD 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [DOWNLOAD 2058] pageInit() avviata");
  avviaDownloadPremium();
};

/* =========================================================
   LOGICA PRINCIPALE
========================================================= */
async function avviaDownloadPremium() {
  console.log("🔥 download-premium.js READY");

  const body = document.getElementById("downloadBody");

  if (!body) {
    console.warn("❌ [DOWNLOAD] #downloadBody NON trovato");
    return;
  }

  /* =========================================================
     1) Recupera /me per verificare login
  ========================================================== */
  console.log("🌐 [DOWNLOAD] Verifica sessione…");

  const me = await apiDownload("/api/utenti/me", { method: "POST" });

  if (!me || me.guest) {
    console.warn("🔒 [DOWNLOAD] Utente non loggato");
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login per accedere ai tuoi file.</td></tr>`;
    return;
  }

  /* =========================================================
     2) Recupera ordini utente
  ========================================================== */
  console.log("🌐 [DOWNLOAD] Recupero ordini utente…");

  const data = await apiDownload("/api/ordini/getOrdiniUtente", {
    method: "GET"
  });

  console.log("📦 [DOWNLOAD] Risposta API:", data);

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

  console.log("🧾 [DOWNLOAD] Ordini validi:", ordiniValidi.length);

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
      console.error("❌ [DOWNLOAD] Errore parsing prodotti_json per ordine:", o.id);
    }
  });

  console.log("📚 [DOWNLOAD] Prodotti estratti:", listaProdotti.length);

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

  console.log("🔁 [DOWNLOAD] Prodotti unici:", unici.length);

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

    console.log("⬇️ [DOWNLOAD] Richiesta download prodotto:", id);

    try {
      btn.textContent = "Preparazione...";
      btn.disabled = true;

      const blob = await apiDownloadBlob(`/api/vendite/downloadFile/${id}`);

      console.log("📄 [DOWNLOAD] Blob ricevuto:", blob);

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
      console.error("❌ [DOWNLOAD] Download fallito:", err);
      alert("Non è stato possibile scaricare il file. Verifica di aver completato il pagamento.");
    } finally {
      setTimeout(() => {
        btn.textContent = originalText;
        btn.disabled = false;
      }, 2000);
    }
  });
}

/* =========================================================
   WRAPPER UNIVERSALE JSON (SAFE MODE)
========================================================= */
async function apiDownload(path, options = {}) {
  console.log("🌐 [DOWNLOAD] API JSON:", path);

  let res;
  try {
    res = await fetch(path, {
      credentials: "include",
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
  } catch (err) {
    console.error("❌ [DOWNLOAD] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [DOWNLOAD] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [DOWNLOAD] Errore API:", json.error || json.raw);
    return null;
  }

  return json; // NON json.data
}

/* =========================================================
   WRAPPER UNIVERSALE BLOB (SAFE MODE)
========================================================= */
async function apiDownloadBlob(path) {
  console.log("🌐 [DOWNLOAD] API BLOB:", path);

  let res;
  try {
    res = await fetch(path, {
      credentials: "include"
    });
  } catch (err) {
    console.error("❌ [DOWNLOAD] Errore rete:", err);
    return null;
  }

  if (!res.ok) {
    console.warn("⚠️ [DOWNLOAD] Risposta non OK:", res.status);
    return null;
  }

  try {
    return await res.blob();
  } catch (e) {
    console.error("❌ [DOWNLOAD] Errore lettura blob:", e);
    return null;
  }
}
