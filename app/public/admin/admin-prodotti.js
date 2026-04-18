/* =========================================================
   ADMIN PRODOTTI — VERSIONE SQL DEFINITIVA + AI 2026.900
   PATCH 2027.400 — critical-ready + fetchUniversale
========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("[ADMIN] Init admin-prodotti.js (CRITICAL READY)");

  const listaBox = document.getElementById("lista-prodotti");
  const titoloForm = document.getElementById("titolo-form");

  // Campi form
  const fTitolo = document.getElementById("titolo");
  const fDescrizione = document.getElementById("descrizione");
  const fPrezzo = document.getElementById("prezzo");

  const fImg = document.getElementById("immagine");
  const fImgUrl = document.getElementById("immagine-url");
  const fPreview = document.getElementById("preview-img");

  const fFileProdotto = document.getElementById("fileProdotto");
  const fStatus = document.getElementById("status");

  // AI
  const btnAiDescrizione = document.getElementById("btn-ai-descrizione");
  const aiStatus = document.getElementById("ai-status");
  const aiPreviewBox = document.getElementById("ai-preview-box");
  const aiPreview = document.getElementById("ai-preview");
  const fDescrizioneBreve = document.getElementById("descrizione-breve");

  let prodottoCorrente = null;

  /* =========================================================
     UPLOAD GENERICO (usa fetchUniversale)
  ========================================================= */
  async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    console.log("[ADMIN] Upload:", endpoint, file.name);

    const res = await window.fetchUniversale(
      endpoint,
      {
        method: "POST",
        body: formData
      },
      { retries: 3, backoffMs: 400 }
    );

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Errore upload");
    }

    return data.filename;
  }

  /* =========================================================
     LISTA PRODOTTI (SQL)
  ========================================================= */
  async function caricaListaProdotti() {
    console.log("[ADMIN] Carico lista prodotti…");

    try {
      const res = await window.fetchUniversale(
        "/api/prodotti",
        { method: "GET" },
        { retries: 3, backoffMs: 400 }
      );

      const prodotti = await res.json();

      if (!Array.isArray(prodotti) || prodotti.length === 0) {
        listaBox.innerHTML = "<p>Nessun prodotto presente.</p>";
        return;
      }

      listaBox.innerHTML = prodotti
        .map(
          (p) => `
        <div class="admin-card">
          <img src="${p.immagine || "/placeholder.webp"}" alt="${p.titolo}">
          <div class="admin-card-info">
            <h3>${p.titolo_breve || p.titolo}</h3>
            <p>${p.prezzo}€</p>
            <button class="btn-modifica" data-id="${p.id}">Modifica</button>
            <button class="btn-elimina" data-id="${p.id}">Elimina</button>
          </div>
        </div>
      `
        )
        .join("");

      document.querySelectorAll(".btn-modifica").forEach((btn) => {
        btn.addEventListener("click", () => caricaProdotto(btn.dataset.id));
      });

      document.querySelectorAll(".btn-elimina").forEach((btn) => {
        btn.addEventListener("click", () => eliminaProdotto(btn.dataset.id));
      });

    } catch (err) {
      console.error("[ADMIN] Errore lista:", err);
      listaBox.innerHTML = "<p>Errore caricamento prodotti.</p>";
    }
  }

  /* =========================================================
     CARICA PRODOTTO PER EDIT (SQL)
  ========================================================= */
  async function caricaProdotto(id) {
    console.log("[ADMIN] Carico prodotto:", id);

    try {
      const res = await window.fetchUniversale(
        `/api/prodotti/${id}`,
        { method: "GET" },
        { retries: 3, backoffMs: 400 }
      );

      const p = await res.json();

      if (!p) {
        fStatus.textContent = "Errore caricamento prodotto.";
        return;
      }

      prodottoCorrente = p;

      titoloForm.textContent = "Modifica prodotto";

      fTitolo.value = p.titolo || "";
      fDescrizione.value = p.descrizione_lunga || "";
      fPrezzo.value = p.prezzo || "";

      if (fDescrizioneBreve) {
        fDescrizioneBreve.value = p.descrizione_breve || "";
      }

      if (aiPreview && aiPreviewBox) {
        if (p.descrizione_lunga) {
          aiPreview.textContent = p.descrizione_lunga;
          aiPreviewBox.style.display = "block";
        } else {
          aiPreview.textContent = "";
          aiPreviewBox.style.display = "none";
        }
      }

      fImg.value = "";
      fImgUrl.value = p.immagine || "";

      if (p.immagine) {
        fPreview.src = p.immagine;
        fPreview.style.display = "block";
      } else {
        fPreview.style.display = "none";
      }

      fFileProdotto.value = "";

      console.log("[ADMIN] Prodotto caricato:", p);

    } catch (err) {
      console.error("[ADMIN] Errore caricamento prodotto:", err);
      fStatus.textContent = "Errore caricamento prodotto.";
    }
  }

  /* =========================================================
     ELIMINA PRODOTTO (SQL)
  ========================================================= */
  async function eliminaProdotto(id) {
    if (!confirm("Eliminare questo prodotto?")) return;

    console.log("[ADMIN] Elimino prodotto:", id);

    try {
      const res = await window.fetchUniversale(
        `/api/prodotti/${id}`,
        { method: "DELETE" },
        { retries: 3, backoffMs: 400 }
      );

      const data = await res.json();

      if (!data || !data.ok) {
        alert("Errore eliminazione prodotto.");
        return;
      }

      prodottoCorrente = null;
      titoloForm.textContent = "Crea / Modifica prodotto";
      const form = document.getElementById("form-prodotto");
      if (form) form.reset();
      fPreview.style.display = "none";
      if (aiPreviewBox) aiPreviewBox.style.display = "none";
      fStatus.textContent = "Prodotto eliminato.";

      caricaListaProdotti();

    } catch (err) {
      console.error("[ADMIN] Errore eliminazione:", err);
    }
  }

  /* =========================================================
     AI: GENERA DESCRIZIONE
  ========================================================= */
  if (btnAiDescrizione) {
    btnAiDescrizione.addEventListener("click", async () => {
      const titolo = fTitolo.value.trim();

      if (!titolo) {
        aiStatus.textContent = "Inserisci prima il titolo.";
        return;
      }

      aiStatus.textContent = "Generazione descrizione con AI…";
      aiPreviewBox.style.display = "none";
      aiPreview.textContent = "";

      try {
        const res = await window.fetchUniversale(
          "/api/prodotti/genera-descrizione-ai",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              titolo,
              contenuto: fDescrizione.value.trim() || ""
            })
          },
          { retries: 3, backoffMs: 400 }
        );

        const data = await res.json();

        if (!data.success) {
          aiStatus.textContent = "Errore generazione AI.";
          return;
        }

        fDescrizione.value = data.descrizione_lunga || "";
        if (fDescrizioneBreve) {
          fDescrizioneBreve.value = data.descrizione_breve || "";
        }

        aiPreview.textContent = data.descrizione_lunga || "";
        aiPreviewBox.style.display = data.descrizione_lunga ? "block" : "none";

        aiStatus.textContent = "Descrizione generata con successo.";

      } catch (err) {
        console.error("[ADMIN] Errore AI:", err);
        aiStatus.textContent = "Errore di connessione con l'AI.";
      }
    });
  }

  /* =========================================================
     SALVA PRODOTTO (SQL)
  ========================================================= */
  document.getElementById("btn-salva").addEventListener("click", async () => {
    console.log("[ADMIN] Salvataggio prodotto…");

    fStatus.textContent = "Caricamento…";

    let immagineURL = prodottoCorrente?.immagine || "";
    let fileProdottoURL = prodottoCorrente?.fileProdotto || "";

    const urlDiretto = fImgUrl.value.trim();
    if (urlDiretto) {
      immagineURL = urlDiretto;
    } else if (fImg.files.length > 0) {
      try {
        immagineURL = await uploadFile("/api/upload/immagine", fImg.files[0]);
      } catch (err) {
        fStatus.textContent = "Errore upload immagine.";
        return;
      }
    }

    if (fFileProdotto.files.length > 0) {
      try {
        fileProdottoURL = await uploadFile("/api/upload/file", fFileProdotto.files[0]);
      } catch (err) {
        fStatus.textContent = "Errore upload file prodotto.";
        return;
      }
    }

    const payload = {
      id: prodottoCorrente?.id || null,
      titolo: fTitolo.value.trim(),
      descrizione_lunga: fDescrizione.value.trim(),
      descrizione_breve: fDescrizioneBreve ? fDescrizioneBreve.value.trim() : "",
      prezzo: parseFloat(fPrezzo.value),
      immagine: immagineURL,
      fileProdotto: fileProdottoURL
    };

    console.log("[ADMIN] Payload finale:", payload);

    try {
      const res = await window.fetchUniversale(
        "/api/prodotti",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        },
        { retries: 3, backoffMs: 400 }
      );

      const p = await res.json();

      if (!p) {
        fStatus.textContent = "Errore salvataggio.";
        return;
      }

      prodottoCorrente = p;

      fStatus.textContent = "Prodotto salvato.";

      if (p.immagine) {
        fPreview.src = p.immagine;
        fPreview.style.display = "block";
      }

      if (aiPreview && aiPreviewBox && p.descrizione_lunga) {
        aiPreview.textContent = p.descrizione_lunga;
        aiPreviewBox.style.display = "block";
      }

      caricaListaProdotti();
      titoloForm.textContent = "Modifica prodotto";

    } catch (err) {
      console.error("[ADMIN] Errore salvataggio:", err);
      fStatus.textContent = "Errore salvataggio.";
    }
  });

  /* =========================================================
     AVVIO
  ========================================================= */
  caricaListaProdotti();
});
