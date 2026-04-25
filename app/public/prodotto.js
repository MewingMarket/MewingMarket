/* =========================================================
   PRODOTTO.JS — Versione SQL SYNC (PATCH 2027.800)
   Mapping: youtube_video_id + immagine_url
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  try {
    // Usiamo fetchUniversale che gestisce automaticamente il Token SQL
    const res = await window.fetchUniversale(`/api/products/${id}`);
    const data = await res.json();
    
    // Normalizzazione SQL: estrae il prodotto dall'oggetto di risposta
    const p = data.prodotto || data.data || data;

    if (!p || !p.id) throw new Error("Prodotto non trovato nel database SQL");

    // 1) Update UI: Testi e Immagini (Mapping immagine_url)
    document.title = `${p.titolo} | MewingMarket`;
    
    const elTitolo = document.getElementById("prodotto-titolo");
    const elSub = document.getElementById("prodotto-subtitle");
    const elDesc = document.getElementById("prodotto-descrizione");
    const elImg = document.getElementById("prodotto-immagine");
    const elPrezzo = document.getElementById("prodotto-prezzo");

    if (elTitolo) elTitolo.textContent = p.titolo;
    if (elSub) elSub.textContent = p.descrizione_breve || "";
    if (elDesc) elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "";
    if (elPrezzo) {
      const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : Number(p.prezzo || 0).toFixed(2);
      elPrezzo.textContent = `€${prezzoEuro}`;
    }
    
    // FIX IMMAGINE: Mapping esatto su immagine_url
    if (elImg) {
      elImg.src = p.immagine_url || p.immagine || "/placeholder.webp";
    }

    // 2) FIX YOUTUBE AUTOMATICO (Mapping youtube_video_id)
    const videoId = p.youtube_video_id || p.video_id; // Cerca la colonna SQL specifica
    const videoSection = document.getElementById("video-section");
    const videoIframe = document.getElementById("prodotto-video");

    if (videoId && videoSection && videoIframe) {
      // Caricamento dinamico dell'embed
      videoIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
      videoSection.style.display = "block";
      console.log("🎬 [PRODOTTO] Video YouTube caricato:", videoId);
    } else {
      if (videoSection) videoSection.style.display = "none";
    }

    // 3) Setup Bottoni Carrello
    setupCartButtons(p);

  } catch (err) {
    console.error("🔥 [PRODOTTO] Errore caricamento SQL:", err);
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Errore: Prodotto non disponibile o database non connesso.";
  }
}

function setupCartButtons(p) {
  const btnPlus = document.getElementById("btn-aggiungi");
  const btnMinus = document.getElementById("btn-rimuovi");
  const btnPay = document.getElementById("btn-paga-subito");

  const prodCarrello = {
    id: p.id,
    titolo: p.titolo,
    // Usa sempre i centesimi per precisione nel carrello
    prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
    immagine: p.immagine_url || p.immagine || "/placeholder.webp"
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

// Avvio sincronizzato con il sistema di autenticazione
document.addEventListener("critical-ready", caricaDettaglioProdotto);
