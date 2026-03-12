/* =========================================================
   ADMIN PRODOTTI — FILE UNICO
   Lista + Modifica + Creazione
   (Patch chirurgica, nessuna logica reinventata)
========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  console.log("[ADMIN] Init admin-prodotti.js");

  const listaBox = document.getElementById("lista-prodotti");
  const titoloForm = document.getElementById("titolo-form");

  // Campi form
  const fTitolo = document.getElementById("titolo");
  const fDescrizione = document.getElementById("descrizione");
  const fPrezzo = document.getElementById("prezzo");
  const fCategoria = document.getElementById("categoria");
  const fSlug = document.getElementById("slug");
  const fYoutube = document.getElementById("youtube");
  const fImg = document.getElementById("immagine");
  const fPreview = document.getElementById("preview-img");
  const fFileProdotto = document.getElementById("fileProdotto");
  const fStatus = document.getElementById("status");

  let prodottoCorrente = null; // null = crea nuovo

  /* =========================================================
     1) CARICA LISTA PRODOTTI
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

      listaBox.innerHTML = data.prodotti
        .map(
          (p) => `
        <div class="admin-card">
          <img src="${p.immagine || "/placeholder.webp"}" alt="${p.titolo}">
          <div class="admin-card-info">
            <h3>${p.titolo}</h3>
            <p>${p.prezzo}€</p>
            <button class="btn-modifica" data-slug="${p.slug}">Modifica</button>
            <button class="btn-elimina" data-slug="${p.slug}">Elimina</button>
          </div>
        </div>
      `
        )
        .join("");

      // Eventi modifica
      document.querySelectorAll(".btn-modifica").forEach((btn) => {
        btn.addEventListener("click", () => {
          caricaProdotto(btn.dataset.slug);
        });
      });

      // Eventi elimina
      document.querySelectorAll(".btn-elimina").forEach((btn) => {
        btn.addEventListener("click", () => {
          eliminaProdotto(btn.dataset.slug);
        });
      });
    } catch (err) {
      console.error("[ADMIN] Errore lista:", err);
      listaBox.innerHTML = "<p>Errore caricamento prodotti.</p>";
    }
  }

  /* =========================================================
     2) CARICA PRODOTTO PER MODIFICA
  ========================================================= */
  async function caricaProdotto(slug) {
    console.log("[ADMIN] Carico prodotto:", slug);

    try {
      const res = await fetch(`/api/products/${slug}`);
      const data = await res.json();

      if (!data.success) {
        fStatus.textContent = "Errore caricamento prodotto.";
        return;
      }

      const p = data.prodotto;
      prodottoCorrente = p;

      titoloForm.textContent = "Modifica prodotto";

      fTitolo.value = p.titolo || "";
      fDescrizione.value = p.descrizione || "";
      fPrezzo.value = p.prezzo || "";
      fCategoria.value = p.categoria || "";
      fSlug.value = p.slug || "";
      fYoutube.value = p.youtube_url || "";

      if (p.immagine) {
        fPreview.src = p.immagine;
        fPreview.style.display = "block";
      }

      console.log("[ADMIN] Prodotto caricato:", p);
    } catch (err) {
      console.error("[ADMIN] Errore caricamento prodotto:", err);
      fStatus.textContent = "Errore caricamento prodotto.";
    }
  }

  /* =========================================================
     3) ELIMINA PRODOTTO
  ========================================================= */
  async function eliminaProdotto(slug) {
    if (!confirm("Eliminare questo prodotto?")) return;

    console.log("[ADMIN] Elimino prodotto:", slug);

    try {
      const res = await fetch(`/api/products/${slug}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!data.success) {
        alert("Errore eliminazione prodotto.");
        return;
      }

      caricaListaProdotti();
    } catch (err) {
      console.error("[ADMIN] Errore eliminazione:", err);
    }
  }

  /* =========================================================
     4) SALVA PRODOTTO (CREA O MODIFICA)
  ========================================================= */
  document.getElementById("btn-salva").addEventListener("click", async () => {
    console.log("[ADMIN] Salvataggio prodotto…");

    const payload = {
      titolo: fTitolo.value.trim(),
      descrizione: fDescrizione.value.trim(),
      prezzo: parseFloat(fPrezzo.value),
      categoria: fCategoria.value.trim(),
      slug: fSlug.value.trim(),
      youtube_url: fYoutube.value.trim(),
    };

    console.log("[ADMIN] Payload:", payload);

    const metodo = prodottoCorrente ? "PUT" : "POST";
    const url = prodottoCorrente
      ? `/api/products/${prodottoCorrente.slug}`
      : "/api/products";

    try {
      const res = await fetch(url, {
        method: metodo,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!data.success) {
        fStatus.textContent = data.error || "Errore salvataggio.";
        return;
      }

      fStatus.textContent = "Prodotto salvato.";
      caricaListaProdotti();
    } catch (err) {
      console.error("[ADMIN] Errore salvataggio:", err);
      fStatus.textContent = "Errore salvataggio.";
    }
  });

  /* =========================================================
     5) AVVIO
  ========================================================= */
  caricaListaProdotti();
});
