/* =========================================================
   ADMIN PRODOTTI — VERSIONE SQL DEFINITIVA + AI 2026.900
   PATCH 2027.500 — Full Sync SQL & AI
========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("[ADMIN] Init admin-prodotti.js (CRITICAL READY)");

  const listaBox = document.getElementById("lista-prodotti");
  const titoloForm = document.getElementById("titolo-form");
  const formProdotto = document.getElementById("form-prodotto");

  // Campi form
  const fTitolo = document.getElementById("titolo");
  const fDescrizione = document.getElementById("descrizione"); // Lungo (AI)
  const fPrezzo = document.getElementById("prezzo");

  const fImg = document.getElementById("immagine");
  const fImgUrl = document.getElementById("immagine-url");
  const fPreview = document.getElementById("preview-img");

  const fFileProdotto = document.getElementById("fileProdotto");
  const fStatus = document.getElementById("status");

  // AI & Extra
  const btnAiDescrizione = document.getElementById("btn-ai-descrizione");
  const aiStatus = document.getElementById("ai-status");
  const aiPreviewBox = document.getElementById("ai-preview-box");
  const aiPreview = document.getElementById("ai-preview");
  const fDescrizioneBreve = document.getElementById("descrizione-breve");

  let prodottoCorrente = null;

  /* =========================================================
     UPLOAD GENERICO
  ========================================================= */
  async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    const res = await window.fetchUniversale(
      endpoint,
      { method: "POST", body: formData },
      { retries: 2 }
    );

    const data = await res.json();
    if (!data.success) throw new Error(data.error || "Errore upload");
    return data.filename; // Path dell'immagine o file salvato
  }

  /* =========================================================
     LISTA PRODOTTI (Visualizzazione SQL)
  ========================================================= */
  async function caricaListaProdotti() {
    try {
      const res = await window.fetchUniversale("/api/prodotti", { method: "GET" });
      const prodotti = await res.json();

      if (!Array.isArray(prodotti) || prodotti.length === 0) {
        listaBox.innerHTML = "<p>Nessun prodotto trovato nel database.</p>";
        return;
      }

      listaBox.innerHTML = prodotti.map(p => {
        // Calcolo prezzo per visualizzazione admin coerente con SQL
        const prezzoMostrato = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
        
        return `
          <div class="admin-card">
            <img src="${p.immagine || p.immagine_url || "/placeholder.webp"}" alt="Prodotto">
            <div class="admin-card-info">
              <h3>${p.titolo_breve || p.titolo}</h3>
              <p>€${prezzoMostrato}</p>
              <div class="admin-actions">
                <button class="btn-modifica" data-id="${p.id}">Modifica</button>
                <button class="btn-elimina" data-id="${p.id}">Elimina</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      // Bind eventi dinamici
      document.querySelectorAll(".btn-modifica").forEach(b => b.onclick = () => caricaProdotto(b.dataset.id));
      document.querySelectorAll(".btn-elimina").forEach(b => b.onclick = () => eliminaProdotto(b.dataset.id));

    } catch (err) {
      console.error("Errore lista:", err);
      listaBox.innerHTML = "<p>Errore durante il caricamento della lista.</p>";
    }
  }

  /* =========================================================
     CARICA PER MODIFICA
  ========================================================= */
  async function caricaProdotto(id) {
    try {
      const res = await window.fetchUniversale(`/api/prodotti/${id}`);
      const p = await res.json();
      if (!p) return;

      prodottoCorrente = p;
      titoloForm.textContent = `Modifica: ${p.titolo}`;

      fTitolo.value = p.titolo || "";
      fDescrizione.value = p.descrizione_lunga || "";
      
      // Caricamento prezzo (gestisce sia centesimi che decimali)
      fPrezzo.value = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
      
      fDescrizioneBreve.value = p.descrizione_breve || "";
      fImgUrl.value = p.immagine || p.immagine_url || "";

      if (p.immagine || p.immagine_url) {
        fPreview.src = p.immagine || p.immagine_url;
        fPreview.style.display = "block";
      }

      if (p.descrizione_lunga) {
        aiPreview.innerHTML = p.descrizione_lunga;
        aiPreviewBox.style.display = "block";
      }

      fStatus.textContent = "Prodotto caricato correttamente.";
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      fStatus.textContent = "Errore nel caricamento del dettaglio.";
    }
  }

  /* =========================================================
     ELIMINA
  ========================================================= */
  async function eliminaProdotto(id) {
    if (!confirm("Sei sicuro di voler eliminare questo prodotto definitivamente?")) return;

    try {
      const res = await window.fetchUniversale(`/api/prodotti/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.ok || data.success) {
        fStatus.textContent = "Prodotto rimosso.";
        caricaListaProdotti();
        if (prodottoCorrente && prodottoCorrente.id == id) resetForm();
      }
    } catch (err) {
      alert("Errore durante l'eliminazione.");
    }
  }

  /* =========================================================
     AI: GENERA CONTENUTO
  ========================================================= */
  if (btnAiDescrizione) {
    btnAiDescrizione.onclick = async () => {
      const titolo = fTitolo.value.trim();
      if (!titolo) return alert("Inserisci un titolo per guidare l'AI.");

      aiStatus.textContent = "Llama sta scrivendo...";
      
      try {
        const res = await window.fetchUniversale("/api/prodotti/genera-descrizione-ai", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ titolo, contenuto: fDescrizione.value })
        });

        const data = await res.json();
        if (data.success) {
          fDescrizione.value = data.descrizione_lunga;
          fDescrizioneBreve.value = data.descrizione_breve;
          aiPreview.innerHTML = data.descrizione_lunga;
          aiPreviewBox.style.display = "block";
          aiStatus.textContent = "Descrizione generata!";
        }
      } catch (err) {
        aiStatus.textContent = "Errore AI.";
      }
    };
  }

  /* =========================================================
     SALVATAGGIO FINALE
  ========================================================= */
  document.getElementById("btn-salva").onclick = async () => {
    fStatus.textContent = "Salvataggio in corso...";

    try {
      let immagineURL = fImgUrl.value.trim();
      
      // Gestione Upload Immagine
      if (fImg.files.length > 0) {
        immagineURL = await uploadFile("/api/upload/immagine", fImg.files[0]);
      }

      // Gestione Upload File Prodotto
      let fileURL = prodottoCorrente?.fileProdotto || prodottoCorrente?.file_consegna_url || "";
      if (fFileProdotto.files.length > 0) {
        fileURL = await uploadFile("/api/upload/file", fFileProdotto.files[0]);
      }

      // Costruzione Payload per SQL
      const payload = {
        id: prodottoCorrente?.id || null,
        titolo: fTitolo.value.trim(),
        descrizione_lunga: fDescrizione.value.trim(),
        descrizione_breve: fDescrizioneBreve.value.trim(),
        // Il backend SQL userà prezzo_cent, lo calcoliamo qui per sicurezza
        prezzo: parseFloat(fPrezzo.value) || 0,
        prezzo_cent: Math.round(parseFloat(fPrezzo.value) * 100) || 0,
        immagine: immagineURL,
        fileProdotto: fileURL
        // Categoria e YouTube verranno gestiti automaticamente dal server
      };

      const res = await window.fetchUniversale("/api/prodotti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      if (result) {
        fStatus.textContent = "Prodotto salvato con successo!";
        resetForm();
        caricaListaProdotti();
      }

    } catch (err) {
      fStatus.textContent = "Errore durante il salvataggio.";
      console.error(err);
    }
  };

  function resetForm() {
    prodottoCorrente = null;
    titoloForm.textContent = "Crea Nuovo Prodotto";
    if (formProdotto) formProdotto.reset();
    fPreview.style.display = "none";
    aiPreviewBox.style.display = "none";
    fStatus.textContent = "Form resettato.";
  }

  // Inizializzazione Manuale
  caricaListaProdotti();
});
