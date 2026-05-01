/* =========================================================
   ADMIN PRODOTTI — UNIVERSAL JSON PATCH 2027.970
   - Token Fix
   - Universal JSON
   - Router Universale
========================================================= */

/* =========================================================
   WRAPPER UNIVERSALE ADMIN (token + universal-json)
========================================================= */
async function adminApi(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(path, { ...options, headers });

  // Token scaduto
  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "/admin/login";
    return null;
  }

  // Prova a leggere JSON universale
  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  // universal-json → { success, data, error, raw }
  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   INIT
========================================================= */
document.addEventListener("critical-ready", () => {
  console.log("[ADMIN] Init admin-prodotti.js (UNIVERSAL JSON)");

  const listaBox = document.getElementById("lista-prodotti");
  const titoloForm = document.getElementById("titolo-form");
  const formProdotto = document.getElementById("form-prodotto");

  const fTitolo = document.getElementById("titolo");
  const fDescrizione = document.getElementById("descrizione");
  const fPrezzo = document.getElementById("prezzo");
  const fImgUrl = document.getElementById("immagine-url");
  const fPreview = document.getElementById("preview-img");
  const fStatus = document.getElementById("status");

  const fYoutubeId = document.getElementById("youtube-id");
  const fCategoria = document.getElementById("categoria");
  const fDescrizioneBreve = document.getElementById("descrizione-breve");

  let prodottoCorrente = null;

  /* =========================================================
     1) CARICA LISTA PRODOTTI
  ========================================================== */
  async function caricaListaProdotti() {
    const prodotti = await adminApi("/api/prodotti/getProdottiAdmin", {
      method: "GET"
    });

    if (!prodotti) {
      listaBox.innerHTML = "<p>Errore o accesso negato.</p>";
      return;
    }

    if (prodotti.length === 0) {
      listaBox.innerHTML = "<p>Nessun prodotto trovato.</p>";
      return;
    }

    listaBox.innerHTML = prodotti.map(p => {
      const prezzoMostrato = p.prezzo_cent
        ? (p.prezzo_cent / 100).toFixed(2)
        : (Number(p.prezzo) || 0).toFixed(2);

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

    document.querySelectorAll(".btn-modifica")
      .forEach(b => b.onclick = () => caricaProdotto(b.dataset.id));

    document.querySelectorAll(".btn-elimina")
      .forEach(b => b.onclick = () => eliminaProdotto(b.dataset.id));
  }

  /* =========================================================
     2) CARICA PRODOTTO
  ========================================================== */
  async function caricaProdotto(id) {
    const p = await adminApi(`/api/prodotti/getProdottoAdminById/${id}`, {
      method: "GET"
    });

    if (!p) {
      fStatus.textContent = "Errore nel recupero del prodotto.";
      return;
    }

    prodottoCorrente = p;
    titoloForm.textContent = `Modifica: ${p.titolo}`;

    fTitolo.value = p.titolo || "";
    fDescrizione.value = p.descrizione_lunga || p.descrizione || "";
    fPrezzo.value = p.prezzo_cent
      ? (p.prezzo_cent / 100).toFixed(2)
      : (Number(p.prezzo) || 0).toFixed(2);

    fDescrizioneBreve.value = p.descrizione_breve || "";
    fImgUrl.value = p.immagine || p.immagine_url || "";

    if (fYoutubeId) fYoutubeId.value = p.youtube_id || p.video_id || "";
    if (fCategoria) fCategoria.value = p.categoria || "";

    if (p.immagine || p.immagine_url) {
      fPreview.src = p.immagine || p.immagine_url;
      fPreview.style.display = "block";
    }

    fStatus.textContent = "Dati caricati.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  /* =========================================================
     3) SALVA PRODOTTO
  ========================================================== */
  document.getElementById("btn-salva").onclick = async () => {
    fStatus.textContent = "Salvataggio...";

    const payload = {
      id: prodottoCorrente?.id || null,
      titolo: fTitolo.value.trim(),
      descrizione_lunga: fDescrizione.value.trim(),
      descrizione_breve: fDescrizioneBreve.value.trim(),
      prezzo_cent: Math.round(parseFloat(fPrezzo.value) * 100),
      immagine: fImgUrl.value.trim(),
      youtube_id: fYoutubeId ? fYoutubeId.value.trim() : "",
      categoria: fCategoria ? fCategoria.value.trim() : ""
    };

    const ok = await adminApi("/api/prodotti/salvaProdottoAdmin", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    if (!ok) {
      fStatus.textContent = "Errore durante il salvataggio.";
      return;
    }

    fStatus.textContent = "Prodotto salvato!";
    resetForm();
    caricaListaProdotti();
  };

  /* =========================================================
     4) ELIMINA PRODOTTO
  ========================================================== */
  async function eliminaProdotto(id) {
    if (!confirm("Vuoi eliminare questo prodotto?")) return;

    const ok = await adminApi(`/api/prodotti/eliminaProdottoAdmin/${id}`, {
      method: "DELETE"
    });

    if (ok) caricaListaProdotti();
    else alert("Errore eliminazione prodotto.");
  }

  /* =========================================================
     RESET FORM
  ========================================================== */
  function resetForm() {
    prodottoCorrente = null;
    titoloForm.textContent = "Crea Nuovo Prodotto";
    if (formProdotto) formProdotto.reset();
    fPreview.style.display = "none";
  }

  /* =========================================================
     AVVIO
  ========================================================== */
  caricaListaProdotti();
});
