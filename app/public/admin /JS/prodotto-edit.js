// =========================================================
// File: app/public/admin/js/prodotto-edit.js
// Gestione creazione/modifica prodotti (Airtable)
// =========================================================

const statusBox = document.getElementById("status");

function setStatus(msg, ok = false) {
  statusBox.textContent = msg;
  statusBox.style.color = ok ? "green" : "red";
}

// =========================================================
// 1. CARICAMENTO PRODOTTO ESISTENTE (per SLUG)
// =========================================================

async function caricaProdotto(slug) {
  try {
    const res = await fetch(`/api/products/${slug}`);
    const data = await res.json();

    if (!data.success) {
      setStatus("Prodotto non trovato");
      return;
    }

    const p = data.prodotto;

    document.getElementById("titolo").value = p.titolo || "";
    document.getElementById("descrizione").value = p.descrizione || "";
    document.getElementById("prezzo").value = p.prezzo || "";
    document.getElementById("slug").value = p.slug || "";

    // Categoria e YouTube non sono gestiti in Airtable
    document.getElementById("categoria").value = p.categoria || "";
    document.getElementById("youtube").value = p.youtube_url || "";

    if (p.immagine) {
      window.immagineURL = p.immagine;
      const preview = document.getElementById("preview-img");
      preview.src = p.immagine;
      preview.style.display = "block";
    }

    if (p.fileProdotto) {
      window.fileProdottoURL = p.fileProdotto;
    }

    setStatus("Prodotto caricato", true);

  } catch (err) {
    console.error(err);
    setStatus("Errore di connessione");
  }
}

// =========================================================
// 2. SLUG AUTOMATICO
// =========================================================

document.getElementById("titolo").addEventListener("input", () => {
  const titolo = document.getElementById("titolo").value;
  const slug = titolo
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  document.getElementById("slug").value = slug;
});

// =========================================================
// 3. CARICAMENTO IMMAGINE
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

  window.immagineURL = data.url;

  const preview = document.getElementById("preview-img");
  preview.src = data.url;
  preview.style.display = "block";

  setStatus("Immagine caricata", true);
});

// =========================================================
// 4. CARICAMENTO FILE PRODOTTO
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
// 5. SALVATAGGIO PRODOTTO (Airtable)
// =========================================================

document.getElementById("btn-salva").addEventListener("click", async () => {
  setStatus("Salvataggio prodotto...");

  const slug = new URLSearchParams(window.location.search).get("slug") || null;

  const body = {
    slug,
    titolo: document.getElementById("titolo").value.trim(),
    descrizione: document.getElementById("descrizione").value.trim(),
    prezzo: parseFloat(document.getElementById("prezzo").value),
    immagine: window.immagineURL || null,
    fileProdotto: window.fileProdottoURL || null
  };

  const res = await fetch("/api/products/save", {
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

  // Se è un nuovo prodotto, reindirizza con lo slug corretto
  if (!slug) {
    setTimeout(() => {
      window.location.href = `/admin/prodotto-edit.html?slug=${body.slug}`;
    }, 800);
  }
});

// =========================================================
// 6. AVVIO
// =========================================================

document.addEventListener("DOMContentLoaded", () => {
  const slug = new URLSearchParams(window.location.search).get("slug");
  if (slug) caricaProdotto(slug);
});
