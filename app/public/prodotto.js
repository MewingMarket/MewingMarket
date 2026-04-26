/* =========================================================
   PRODOTTO.JS — Versione SQL SYNC (PATCH 2027.800)
   Mapping: youtube_video_id + immagine_url
   Focus: Solo Acquista Ora -> Checkout
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    // Gestione Token SQL tramite fetchUniversale
    const res = await window.fetchUniversale(`/api/products/${id}`);
    const data = await res.json();
    
    // Normalizzazione dati dal Backend
    const p = data.prodotto || data.data || data;

    if (!p || !p.id) throw new Error("Prodotto non trovato nel database SQL");

    // 1) Update UI: Titoli, Descrizione, Prezzo
    document.title = `${p.titolo} | MewingMarket`;
    
    const elTitolo = document.getElementById("prodotto-titolo");
    const elSub = document.getElementById("prodotto-subtitle");
    const elDesc = document.getElementById("prodotto-descrizione");
    const elImg = document.getElementById("prodotto-immagine");
    const elPrezzo = document.getElementById("prodotto-prezzo");

    if (elTitolo) elTitolo.textContent = p.titolo;
    if (elSub) elSub.textContent = p.descrizione_breve || "";
    if (elDesc) elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "";
    
    const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : Number(p.prezzo || 0).toFixed(2);
    if (elPrezzo) elPrezzo.textContent = `€${prezzoEuro}`;
    
    // Immagine con mapping immagine_url
    if (elImg) {
      elImg.src = p.immagine_url || p.immagine || "/placeholder.webp";
    }

    // 2) Gestione Video YouTube
    const videoId = p.youtube_video_id || p.video_id;
    const videoSection = document.getElementById("video-section");
    const videoIframe = document.getElementById("prodotto-video");

    if (videoId && videoSection && videoIframe) {
      videoIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      videoSection.style.display = "block";
    } else if (videoSection) {
      videoSection.style.display = "none";
    }

    // 3) Setup unico tasto Acquista Ora
    setupAcquistoDiretto(p);

  } catch (err) {
    console.error("🔥 [PRODOTTO] Errore caricamento SQL:", err);
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Errore: Prodotto non disponibile.";
  }
}

/**
 * Configura il tasto Acquista Ora per aggiungere al carrello e andare al checkout
 */
function setupAcquistoDiretto(p) {
  // Selezioniamo il tasto principale definito nell'HTML
  const btnAcquista = document.getElementById("btn-acquista-hero");

  if (btnAcquista) {
    btnAcquista.onclick = () => {
      // Prepariamo l'oggetto per il carrello
      const prodCarrello = {
        id: p.id,
        titolo: p.titolo,
        prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
        immagine: p.immagine_url || p.immagine || "/placeholder.webp"
      };

      console.log("🛒 Aggiunta al carrello e reindirizzamento...");
      
      // Funzione globale del carrello
      if (typeof window.aggiungiAlCarrello === "function") {
        window.aggiungiAlCarrello(prodCarrello);
      }

      // Reindirizzamento immediato al checkout
      window.location.href = "checkout.html";
    };
  }
}

// Avvio al segnale di sistema pronto
document.addEventListener("critical-ready", caricaDettaglioProdotto);
