// =========================================================
// File: app/public/admin/js/prodotto-edit.js
// Gestione creazione/modifica prodotti con salvataggio automatico
// =========================================================

const statusBox = document.getElementById("status");

// Funzione messaggi
function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// 1. CARICAMENTO IMMAGINE
// =========================================================

document.getElementById("immagine").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus("Caricamento immagine...");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload/immagine", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!data.success) {
    setStatus("Errore caricamento immagine");
    return;
  }

  // Salviamo l'URL nel campo nascosto
  window.immagineURL = data.url;

  // Anteprima
  const preview = document.getElementById("preview-img");
  preview.src = data.url;
  preview.style.display = "block";

  setStatus("Immagine caricata", true);
});

// =========================================================
// 2. CARICAMENTO FILE PRODOTTO
// =========================================================

document.getElementById("fileProdotto").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  setStatus("Caricamento file prodotto...");

  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/upload/file", {
    method: "POST",
    body: formData
  });

  const data = await res.json();

  if (!data.success) {
    setStatus("Errore caricamento file");
    return;
  }

  window.fileProdottoURL = data.url;

  setStatus("File prodotto caricato", true);
});

// =========================================================
// 3. SALVATAGGIO PRODOTTO (NUOVO O ESISTENTE)
// =========================================================

document.getElementById("btn-salva").addEventListener("click", async () => {
  setStatus("Salvataggio prodotto...");

  const body = {
    id: new URLSearchParams(window.location.search).get("id") || null,
    titolo: document.getElementById("titolo").value.trim(),
    descrizione: document.getElementById("descrizione").value.trim(),
    prezzo: parseFloat(document.getElementById("prezzo").value),
    categoria: document.getElementById("categoria").value.trim(),
    slug: document.getElementById("slug").value.trim(),
    youtube: document.getElementById("youtube").value.trim(),
    immagine: window.immagineURL || null,
    fileProdotto: window.fileProdottoURL || null
  };

  const res = await fetch("/api/prodotti/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!data.success) {
    setStatus(data.error || "Errore salvataggio prodotto");
    return;
  }

  setStatus("Prodotto salvato con successo!", true);

  // Se è un nuovo prodotto → redirect alla pagina con ID
  if (!body.id) {
    setTimeout(() => {
      window.location.href = `/admin/prodotto-edit.html?id=${data.id}`;
    }, 1000);
  }
});
