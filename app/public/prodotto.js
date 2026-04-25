/* =========================================================
   PRODOTTO.JS — PATCH 2027.600 (YouTube Fix + UI Buttons)
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) return;

  try {
    const res = await window.fetchUniversale(`/api/products/${id}`);
    const data = await res.json();
    const p = data.prodotto || data.data || data;

    if (!p || !p.id) throw new Error("Prodotto non trovato");

    // 1) Update Testi e Prezzi
    document.title = `${p.titolo} | MewingMarket`;
    document.getElementById("prodotto-titolo").textContent = p.titolo;
    document.getElementById("prodotto-subtitle").textContent = p.descrizione_breve || "";
    document.getElementById("prodotto-descrizione").innerHTML = p.descrizione_lunga || p.descrizione;
    
    const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : Number(p.prezzo).toFixed(2);
    document.getElementById("prodotto-prezzo").textContent = `€${prezzoEuro}`;
    document.getElementById("prodotto-immagine").src = p.immagine || "/placeholder.webp";

    // 2) FIX YOUTUBE
    // Controlla se esiste un campo youtube_id o video_url nel database
    const videoId = p.youtube_id || p.video_id;
    const videoSection = document.getElementById("video-section");
    const videoIframe = document.getElementById("prodotto-video");

    if (videoId && videoSection && videoIframe) {
      videoIframe.src = `https://www.youtube.com/embed/${videoId}`;
      videoSection.style.display = "block"; // Lo rende visibile solo se c'è il video
    }

    // 3) Setup Bottoni
    setupCartButtons(p);

  } catch (err) {
    console.error("[PRODOTTO] Errore:", err);
    document.getElementById("prodotto-descrizione").textContent = "Errore durante il recupero dei dati.";
  }
}

function setupCartButtons(p) {
  const btnPlus = document.getElementById("btn-aggiungi");
  const btnMinus = document.getElementById("btn-rimuovi");
  const btnPay = document.getElementById("btn-paga-subito");

  const prodCarrello = {
    id: p.id,
    titolo: p.titolo,
    prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
    immagine: p.immagine
  };

  if (btnPlus) {
    btnPlus.onclick = () => window.aggiungiAlCarrello(prodCarrello);
  }

  if (btnMinus) {
    btnMinus.onclick = () => window.rimuoviSingoloDalCarrello(p.id);
  }

  if (btnPay) {
    btnPay.onclick = () => {
      window.aggiungiAlCarrello(prodCarrello);
      window.location.href = "checkout.html";
    };
  }
}

document.addEventListener("critical-ready", caricaDettaglioProdotto);
