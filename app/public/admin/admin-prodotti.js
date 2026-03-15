/* =========================================================
   ADMIN PRODOTTI — FILE UNICO (PATCH SQL, ID-BASED)
   Lista + Modifica + Creazione + Upload
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("[ADMIN] Init admin-prodotti.js");

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

  let prodottoCorrente = null;

  /* =========================================================
     UPLOAD GENERICO
  ========================================================= */
  async function uploadFile(endpoint, file) {
    const formData = new FormData();
    formData.append("file", file);

    console.log("[ADMIN] Upload:", endpoint, file.name);

    const res = await fetch(endpoint, {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || "Errore upload");
    }

    return data.url;
  }

  /* =========================================================
     LISTA PRODOTTI
  ========================================================= */
  async function caricaListaProdotti() {
    console.log("[ADMIN] Carico lista prodotti…");

    try {
      const res = await fetch("/api/products");
      const data = await res.json();

      if (!data.success) {
        listaBox.innerHTML = "<p>Errore caricamento prodotti.</p>";
        return;
      }

      if (!Array.isArray(data.prodotti) || data.prodotti.length === 0) {
        listaBox.innerHTML = "<p>Nessun prodotto presente.</p>";
        return;
      }

      listaBox.innerHTML = data.prodotti
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
     CARICA PRODOTTO PER EDIT (ID)
  ========================================================= */
  async function caricaProdotto(id) {
    console.log("[ADMIN] Carico prodotto:", id);

    try {
      const res = await fetch(`/api/products/${id}`);
      const data = await res.json();

      if (!data.success) {
        fStatus.textContent = "Errore caricamento prodotto.";
        return;
      }

      const p = data.prodotto;
      prodottoCorrente = p;

      titoloForm.textContent = "Modifica prodotto";

      fTitolo.value = p.titolo || "";
      fDescrizione.value = p.descrizione_lunga || "";
      fPrezzo.value = p.prezzo || "";

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
     ELIMINA PRODOTTO (ID)
  ========================================================= */
  async function eliminaProdotto(id) {
    if (!confirm("Eliminare questo prodotto?")) return;

    console.log("[ADMIN] Elimino prodotto:", id);

    try {
      const res = await fetch(`/api/products/${id}`, {
        method: "DELETE"
      });

      const data = await res.json();

      if (!data.success) {
        alert("Errore eliminazione prodotto.");
        return;
      }

      prodottoCorrente = null;
      titoloForm.textContent = "Crea / Modifica prodotto";
      document.getElementById("form-prodotto").reset();
      fPreview.style.display = "none";
      fStatus.textContent = "Prodotto eliminato.";

      caricaListaProdotti();

    } catch (err) {
      console.error("[ADMIN] Errore eliminazione:", err);
    }
  }

  /* =========================================================
     SALVA PRODOTTO (CREA O MODIFICA)
  ========================================================= */
  document.getElementById("btn-salva").addEventListener("click", async () => {
    console.log("[ADMIN] Salvataggio prodotto…");

    fStatus.textContent = "Caricamento…";

    let immagineURL = prodottoCorrente?.immagine || "";
    let fileProdottoURL = prodottoCorrente?.fileProdotto || "";

    // 1) URL immagine da campo testo ha priorità
    const urlDiretto = fImgUrl.value.trim();
    if (urlDiretto) {
      immagineURL = urlDiretto;
    } else if (fImg.files.length > 0) {
      // 2) upload immagine
      try {
        immagineURL = await uploadFile("/api/upload/immagine", fImg.files[0]);
      } catch (err) {
        fStatus.textContent = "Errore upload immagine.";
        return;
      }
    }

    // File prodotto (opzionale)
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
      prezzo: parseFloat(fPrezzo.value),
      immagine: immagineURL,
      fileProdotto: fileProdottoURL
    };

    console.log("[ADMIN] Payload finale:", payload);

    try {
      const res = await fetch("/api/products/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!data.success) {
        fStatus.textContent = data.error || "Errore salvataggio.";
        return;
      }

      const p = data.prodotto;
      prodottoCorrente = p;

      fStatus.textContent = "Prodotto salvato.";

      // Aggiorna preview immagine
      if (p.immagine) {
        fPreview.src = p.immagine;
        fPreview.style.display = "block";
      }

      // Aggiorna lista prodotti
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
