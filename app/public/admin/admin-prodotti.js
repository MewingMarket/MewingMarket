/* =========================================================
   ADMIN PRODOTTI — VERSIONE SQL DEFINITIVA + YOUTUBE FIX
   PATCH 2027.600 — Sincronizzazione Totale
========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("[ADMIN] Init admin-prodotti.js (Sblocco SQL)");

  const listaBox = document.getElementById("lista-prodotti");
  const titoloForm = document.getElementById("titolo-form");
  const formProdotto = document.getElementById("form-prodotto");

  // Campi form standard
  const fTitolo = document.getElementById("titolo");
  const fDescrizione = document.getElementById("descrizione");
  const fPrezzo = document.getElementById("prezzo");
  const fImg = document.getElementById("immagine");
  const fImgUrl = document.getElementById("immagine-url");
  const fPreview = document.getElementById("preview-img");
  const fStatus = document.getElementById("status");

  // Campi Extra (YouTube e Categorie)
  const fYoutubeId = document.getElementById("youtube-id"); // Assicurati che esista nell'HTML
  const fCategoria = document.getElementById("categoria"); // Assicurati che esista nell'HTML
  const fDescrizioneBreve = document.getElementById("descrizione-breve");

  let prodottoCorrente = null;

  /* 1) CARICA LISTA (FIX: Gestione Array e Oggetti SQL) */
  async function caricaListaProdotti() {
    try {
      // Usiamo fetchUniversale che ora invia il TOKEN correttamente
      const res = await window.fetchUniversale("/api/prodotti", { method: "GET" });
      const data = await res.json();

      // Normalizzazione: Il database SQL spesso risponde con {prodotti: []} o array diretto
      const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);

      if (prodotti.length === 0) {
        listaBox.innerHTML = "<p>Database SQL vuoto o Accesso negato (Token mancante).</p>";
        return;
      }

      listaBox.innerHTML = prodotti.map(p => {
        const prezzoMostrato = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
        const ytBadge = (p.youtube_id || p.video_id) ? "🎬" : "";
        
        return `
          <div class="admin-card" style="border-left: 5px solid ${ytBadge ? '#ff0000' : '#ccc'}">
            <img src="${p.immagine || p.immagine_url || "/placeholder.webp"}" alt="Prodotto">
            <div class="admin-card-info">
              <h3>${ytBadge} ${p.titolo_breve || p.titolo}</h3>
              <p>€${prezzoMostrato} | ID: ${p.id}</p>
              <div class="admin-actions">
                <button class="btn-modifica" data-id="${p.id}">Modifica</button>
                <button class="btn-elimina" data-id="${p.id}">Elimina</button>
              </div>
            </div>
          </div>
        `;
      }).join("");

      document.querySelectorAll(".btn-modifica").forEach(b => b.onclick = () => caricaProdotto(b.dataset.id));
      document.querySelectorAll(".btn-elimina").forEach(b => b.onclick = () => eliminaProdotto(b.dataset.id));

    } catch (err) {
      console.error("Errore lista Admin:", err);
      listaBox.innerHTML = "<p>Errore di connessione al database SQL.</p>";
    }
  }

  /* 2) CARICA PER MODIFICA (FIX: YouTube mapping) */
  async function caricaProdotto(id) {
    try {
      const res = await window.fetchUniversale(`/api/prodotti/${id}`);
      const data = await res.json();
      const p = data.prodotto || data.data || data;

      if (!p) return;

      prodottoCorrente = p;
      titoloForm.textContent = `Modifica: ${p.titolo}`;

      fTitolo.value = p.titolo || "";
      fDescrizione.value = p.descrizione_lunga || p.descrizione || "";
      fPrezzo.value = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
      fDescrizioneBreve.value = p.descrizione_breve || "";
      fImgUrl.value = p.immagine || p.immagine_url || "";
      
      // Carica YouTube e Categoria se presenti
      if(fYoutubeId) fYoutubeId.value = p.youtube_id || p.video_id || "";
      if(fCategoria) fCategoria.value = p.categoria || "";

      if (p.immagine || p.immagine_url) {
        fPreview.src = p.immagine || p.immagine_url;
        fPreview.style.display = "block";
      }

      fStatus.textContent = "Dati SQL caricati.";
      window.scrollTo({ top: 0, behavior: 'smooth' });

    } catch (err) {
      fStatus.textContent = "Errore nel recupero del prodotto.";
    }
  }

  /* 3) SALVATAGGIO (FIX: Payload Completo) */
  document.getElementById("btn-salva").onclick = async () => {
    fStatus.textContent = "Salvataggio SQL...";

    try {
      const payload = {
        id: prodottoCorrente?.id || null,
        titolo: fTitolo.value.trim(),
        descrizione_lunga: fDescrizione.value.trim(),
        descrizione_breve: fDescrizioneBreve.value.trim(),
        prezzo_cent: Math.round(parseFloat(fPrezzo.value) * 100),
        immagine: fImgUrl.value.trim(),
        youtube_id: fYoutubeId ? fYoutubeId.value.trim() : "", // Fondamentale per embed automatico
        categoria: fCategoria ? fCategoria.value.trim() : ""
      };

      const res = await window.fetchUniversale("/api/prodotti", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        fStatus.textContent = "Database SQL aggiornato!";
        resetForm();
        caricaListaProdotti();
      }
    } catch (err) {
      fStatus.textContent = "Errore durante il salvataggio.";
    }
  };

  function resetForm() {
    prodottoCorrente = null;
    titoloForm.textContent = "Crea Nuovo Prodotto";
    if (formProdotto) formProdotto.reset();
    fPreview.style.display = "none";
  }

  caricaListaProdotti();
});
