// FILE: public/admin/admin-prodotti.js
// PATH: public/admin/admin-prodotti.js

/* =========================================================
   ADMIN PRODOTTI — Versione 2027.1 (AI + FILE + IMG + CONFIG)
========================================================= */

async function adminApi(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  const res = await fetch(path, { ...options, headers });

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    location.href = "/admin/login";
    return null;
  }

  let json;
  try { json = await res.json(); } catch { return null; }

  return json.success ? json.data : null;
}

document.addEventListener("critical-ready", () => {
  console.log("🔥 admin-prodotti.js 2027.1 READY");

  /* ---------------------------------------------------------
     ELEMENTI DOM
  --------------------------------------------------------- */
  const boxPubblicati = document.getElementById("lista-pubblicati");
  const boxDaCreare = document.getElementById("lista-da-creare");

  const editPub = document.getElementById("sezione-edit-pubblicato");
  const editAI = document.getElementById("sezione-edit-da-creare");

  /* PUBBLICATI */
  const epTitolo = document.getElementById("edit-titolo");
  const epDescrizione = document.getElementById("edit-descrizione");
  const epPrezzo = document.getElementById("edit-prezzo");
  const epImgUrl = document.getElementById("edit-immagine-url");
  const epPreview = document.getElementById("edit-preview-img");
  const epStatus = document.getElementById("status-pubblicato");

  /* AI */
  const aiTitolo = document.getElementById("ai-titolo");
  const aiCategoria = document.getElementById("ai-categoria");
  const aiPrezzo = document.getElementById("ai-prezzo");
  const aiDescrizione = document.getElementById("ai-descrizione-tecnica");
  const aiImgUrl = document.getElementById("ai-immagine-url");
  const aiPreview = document.getElementById("ai-preview-img");
  const aiFile = document.getElementById("ai-file");
  const aiStatus = document.getElementById("status-da-creare");

  let prodottoPubCorrente = null;
  let prodottoAICorrente = null;

  /* =========================================================
     1) CARICA PRODOTTI PUBBLICATI
  ========================================================== */
  async function caricaPubblicati() {
    boxPubblicati.innerHTML = "<p>Caricamento...</p>";

    const prodotti = await adminApi("/api/prodotti/getProdottiAdmin", { method: "GET" });

    if (!prodotti || prodotti.length === 0) {
      boxPubblicati.innerHTML = "<p>Nessun prodotto pubblicato.</p>";
      return;
    }

    boxPubblicati.innerHTML = prodotti.map(p => `
      <div class="admin-card">
        <img src="${p.immagine || p.immagine_url || "/placeholder.webp"}">
        <div class="admin-card-info">
          <h3>${p.titolo}</h3>
          <p>€${(p.prezzo_cent / 100).toFixed(2)}</p>
          <button class="btn-modifica-pub" data-id="${p.id}">Modifica</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".btn-modifica-pub")
      .forEach(btn => btn.onclick = () => apriEditorPub(btn.dataset.id));
  }

  async function apriEditorPub(id) {
    editAI.style.display = "none";
    editPub.style.display = "block";

    const p = await adminApi(`/api/prodotti/getProdottoAdminById/${id}`, { method: "GET" });
    if (!p) return;

    prodottoPubCorrente = p;

    epTitolo.value = p.titolo;
    epDescrizione.value = p.descrizione_lunga || "";
    epPrezzo.value = (p.prezzo_cent / 100).toFixed(2);
    epImgUrl.value = p.immagine || p.immagine_url || "";

    if (p.immagine || p.immagine_url) {
      epPreview.src = p.immagine || p.immagine_url;
      epPreview.style.display = "block";
    } else {
      epPreview.style.display = "none";
    }
  }

  document.getElementById("btn-salva-pubblicato").onclick = async () => {
    if (!prodottoPubCorrente) return;

    epStatus.textContent = "Salvataggio...";

    const payload = {
      id: prodottoPubCorrente.id,
      titolo: epTitolo.value.trim(),
      descrizione_lunga: epDescrizione.value.trim(),
      prezzo_cent: Math.round(parseFloat(epPrezzo.value) * 100),
      immagine: epImgUrl.value.trim()
    };

    const ok = await adminApi("/api/prodotti/salvaProdottoAdmin", {
      method: "POST",
      body: JSON.stringify(payload)
    });

    epStatus.textContent = ok ? "Salvato!" : "Errore salvataggio.";
    caricaPubblicati();
  };

  /* =========================================================
     2) CARICA PRODOTTI DA CREARE (AI)
  ========================================================== */
  async function caricaDaCreare() {
    boxDaCreare.innerHTML = "<p>Caricamento...</p>";

    const prodotti = await adminApi("/api/admin/getprodottidacreare", { method: "GET" });

    if (!prodotti || prodotti.length === 0) {
      boxDaCreare.innerHTML = "<p>Nessun prodotto da generare.</p>";
      return;
    }

    boxDaCreare.innerHTML = prodotti.map(p => `
      <div class="admin-card">
        <img src="${p.immagine_url || "/placeholder.webp"}">
        <div class="admin-card-info">
          <h3>${p.titolo}</h3>
          <p>Stato: ${p.stato}</p>
          <button class="btn-modifica-ai" data-id="${p.id}">Apri</button>
        </div>
      </div>
    `).join("");

    document.querySelectorAll(".btn-modifica-ai")
      .forEach(btn => btn.onclick = () => apriEditorAI(btn.dataset.id));
  }

  async function apriEditorAI(id) {
    editPub.style.display = "none";
    editAI.style.display = "block";

    const lista = await adminApi("/api/admin/getprodottidacreare", { method: "GET" });
    const p = lista.find(x => x.id == id);
    if (!p) return;

    prodottoAICorrente = p;

    aiTitolo.value = p.titolo;
    aiCategoria.value = p.categoria || "";
    aiPrezzo.value = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : "";
    aiDescrizione.value = p.descrizione_tecnica || "";
    aiImgUrl.value = p.immagine_url || "";

    if (p.immagine_url) {
      aiPreview.src = p.immagine_url;
      aiPreview.style.display = "block";
    } else {
      aiPreview.style.display = "none";
    }

    /* FILE DI CONSEGNA */
    if (p.file_consegna_url) {
      aiFile.innerHTML = `
        <a href="${p.file_consegna_url}" target="_blank" class="btn-primario">
          📄 Scarica file di consegna
        </a>
      `;
      aiStatus.textContent = "File generato correttamente.";
    } else {
      aiFile.innerHTML = "";
      aiStatus.textContent = "File non generato o in errore.";
    }
  }

  /* =========================================================
     3) APPROVA PRODOTTO AI
  ========================================================== */
  document.getElementById("btn-approva-prodotto").onclick = async () => {
    if (!prodottoAICorrente) return;

    aiStatus.textContent = "Approvazione...";

    const ok = await adminApi("/api/admin/approvaprodotto", {
      method: "POST",
      body: JSON.stringify({ id: prodottoAICorrente.id })
    });

    aiStatus.textContent = ok ? "Prodotto pubblicato!" : "Errore approvazione.";
    caricaPubblicati();
    caricaDaCreare();
  };

  /* =========================================================
     4) ELIMINA PRODOTTO AI
  ========================================================== */
  document.getElementById("btn-elimina-da-creare").onclick = async () => {
    if (!prodottoAICorrente) return;
    if (!confirm("Eliminare questo prodotto AI?")) return;

    const ok = await adminApi(`/api/admin/eliminaprodottodacreare/${prodottoAICorrente.id}`, {
      method: "DELETE"
    });

    aiStatus.textContent = ok ? "Eliminato." : "Errore eliminazione.";
    caricaDaCreare();
    editAI.style.display = "none";
  };

  /* =========================================================
     AVVIO
  ========================================================== */
  caricaPubblicati();
  caricaDaCreare();
});
