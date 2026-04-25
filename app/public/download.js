/* =========================================================
   DOWNLOAD PREMIUM — Versione SQL SYNC
   Mapping: ordini.prodotti_json + ordini.stato
========================================================= */

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  const body = document.getElementById("downloadBody");

  if (!body) return;

  // 1) Protezione login
  if (!token) {
    body.innerHTML = `<tr><td colspan="3">Devi effettuare il login per accedere ai tuoi file.</td></tr>`;
    return;
  }

  // 2) Recupera ordini utente tramite API sincronizzata
  try {
    const res = await window.fetchUniversale("/api/ordini/utente", {
      headers: { "Authorization": "Bearer " + token }
    });

    const data = await res.json();

    if (!data.success || !Array.isArray(data.ordini) || data.ordini.length === 0) {
      body.innerHTML = `<tr><td colspan="3">Nessun ordine trovato nel tuo account.</td></tr>`;
      return;
    }

    // 3) FILTRA SOLO ORDINI PAGATI (Verifica colonna 'stato' della tabella ordini)
    // Nota: Il tuo SQL usa 'pagato', non 'completato'
    const ordiniValidi = data.ordini.filter(o => o.stato === "pagato" || o.stato === "completato");

    if (ordiniValidi.length === 0) {
      body.innerHTML = `<tr><td colspan="3">I tuoi ordini sono in attesa di conferma o annullati.</td></tr>`;
      return;
    }

    // 4) Estrai e PARSA prodotti_json
    const listaProdotti = [];

    ordiniValidi.forEach(o => {
      try {
        // PATCH CRITICA: Trasformiamo la stringa SQL prodotti_json in un array JS
        const prodottiAcquistati = typeof o.prodotti_json === 'string' 
          ? JSON.parse(o.prodotti_json) 
          : (o.prodotti || []);

        if (Array.isArray(prodottiAcquistati)) {
          prodottiAcquistati.forEach(p => {
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

    // 5) Deduplica (Evitiamo doppioni se l'utente ha comprato lo stesso ebook due volte)
    const unici = [];
    const visti = new Set();

    listaProdotti.forEach(p => {
      if (!visti.has(p.prodotto_id)) {
        visti.add(p.prodotto_id);
        unici.push(p);
      }
    });

    if (unici.length === 0) {
      body.innerHTML = `<tr><td colspan="3">Nessun file disponibile per il download.</td></tr>`;
      return;
    }

    // 6) Render Tabella
    body.innerHTML = "";
    unici.forEach(p => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><b>${p.titolo}</b></td>
        <td><small>${p.data ? new Date(p.data).toLocaleDateString("it-IT") : "—"}</small></td>
        <td><button class="btn-download" data-id="${p.prodotto_id}">Scarica PDF</button></td>
      `;
      body.appendChild(tr);
    });

  } catch (err) {
    console.error("🔥 [DOWNLOAD] Errore:", err);
    body.innerHTML = `<tr><td colspan="3">Errore tecnico durante il recupero dei file.</td></tr>`;
  }

  // 7) Sistema di Download Sicuro (Blob)
  document.addEventListener("click", async (e) => {
    if (!e.target.classList.contains("btn-download")) return;

    const btn = e.target;
    const id = btn.dataset.id;
    const originalText = btn.textContent;

    try {
      btn.textContent = "Preparazione...";
      btn.disabled = true;

      // Chiamata all'endpoint di download (che deve verificare il possesso nel DB)
      const res = await window.fetchUniversale(`/api/vendite/download/${id}`, {
        headers: { "Authorization": "Bearer " + token }
      });

      if (!res.ok) throw new Error("Accesso negato o file non trovato");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      // Il nome del file può essere dinamico, qui usiamo un default
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
