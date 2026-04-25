/* =========================================================
   PRODOTTO.JS — PATCH 2027.700 (YouTube Auto-Embed + UI Sync)
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

    // 1) Testi e Prezzi
    document.title = `${p.titolo} | MewingMarket`;
    document.getElementById("prodotto-titolo").textContent = p.titolo;
    document.getElementById("prodotto-subtitle").textContent = p.descrizione_breve || "";
    document.getElementById("prodotto-descrizione").innerHTML = p.descrizione_lunga || p.descrizione;
    
    const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : Number(p.prezzo).toFixed(2);
    document.getElementById("prodotto-prezzo").textContent = `€${prezzoEuro}`;
    document.getElementById("prodotto-immagine").src = p.immagine || p.immagine_url || "/placeholder.webp";

    // 2) FIX YOUTUBE AUTOMATICO
    // Cerca l'ID nel campo youtube_id o prova a estrarlo da un video_url
    let videoId = p.youtube_id || p.video_id;
    if (!videoId && p.video_url && p.video_url.includes("v=")) {
        videoId = p.video_url.split("v=")[1].split("&")[0];
    }

    const videoSection = document.getElementById("video-section");
    const videoIframe = document.getElementById("prodotto-video");

    if (videoId && videoSection && videoIframe) {
      videoIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      videoSection.style.display = "block";
    }

    setupCartButtons(p);

  } catch (err) {
    console.error("[PRODOTTO] Errore:", err);
    const desc = document.getElementById("prodotto-descrizione");
    if(desc) desc.textContent = "Dati non disponibili o errore di connessione SQL.";
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
    immagine: p.immagine || p.immagine_url
  };

  if (btnPlus) btnPlus.onclick = () => window.aggiungiAlCarrello(prodCarrello);
  if (btnMinus) btnMinus.onclick = () => window.rimuoviSingoloDalCarrello(p.id);
  if (btnPay) {
    btnPay.onclick = () => {
      window.aggiungiAlCarrello(prodCarrello);
      window.location.href = "checkout.html";
    };
  }
}

document.addEventListener("critical-ready", caricaDettaglioProdotto);
