/* =========================================================
   PRODOTTO.JS — MODELLO DEFINITIVO (SYNC SQL)
   PATCH 2027.500 — Full Compatibility & Critical-Ready
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.error("[PRODOTTO] ID Prodotto mancante nell'URL");
    return;
  }

  console.log(`[PRODOTTO] Caricamento dati per ID: ${id}...`);

  try {
    // 1) Fetch dei dati tramite fetchUniversale (garantita da critical-ready)
    const res = await window.fetchUniversale(`/api/products/${id}`, {
      method: "GET"
    }, { retries: 3 });

    if (!res.ok) throw new Error(`Errore Server: ${res.status}`);

    const data = await res.json();

    // Il backend SQL risponde solitamente con { success: true, prodotto: {...} } o direttamente l'oggetto
    const p = data.prodotto || data.data || data;

    if (!p || (!p.id && !p._id)) {
      console.error("[PRODOTTO] Dati non validi o prodotto inesistente");
      const container = document.getElementById("page-product");
      if (container) container.innerHTML = "<h1 style='text-align:center; margin-top:50px;'>Prodotto non trovato</h1>";
      return;
    }

    // 2) Update UI - Mapping campi SQL
    document.title = `${p.titolo} | MewingMarket`;
    
    const elTitolo = document.getElementById("prodotto-titolo");
    const elPrezzo = document.getElementById("prodotto-prezzo");
    const elDesc = document.getElementById("prodotto-descrizione");
    const elImg = document.getElementById("prodotto-immagine");
    const elSubtitle = document.getElementById("prodotto-subtitle");

    if (elTitolo) elTitolo.textContent = p.titolo;
    if (elSubtitle) elSubtitle.textContent = p.descrizione_breve || "";
    
    // Iniezione descrizione (Lunga se presente, altrimenti standard)
    if (elDesc) {
      elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "Nessuna descrizione disponibile.";
    }
    
    // Gestione prezzo: trasforma centesimi SQL in Euro decimale
    if (elPrezzo) {
      const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
      elPrezzo.textContent = `€${prezzoEuro}`;
    }

    // Fallback immagine
    if (elImg) {
      elImg.src = p.immagine || p.immagine_url || "/placeholder.webp";
      elImg.alt = p.titolo;
    }

    // 3) Gestione Video YouTube (se presente nel DB)
    const videoId = p.youtube_id || p.video_id;
    const videoBox = document.getElementById("video-section");
    const videoIframe = document.getElementById("prodotto-video");

    if (videoId && videoBox && videoIframe) {
      videoIframe.src = `https://www.youtube.com/embed/${videoId}`;
      videoBox.style.display = "block";
    }

    // 4) Configurazione Bottoni Carrello
    setupCartButtons(p);

    console.log("[PRODOTTO] Render completato con successo.");

  } catch (err) {
    console.error("[PRODOTTO] Errore critico:", err);
    const elTitolo = document.getElementById("prodotto-titolo");
    if (elTitolo) elTitolo.textContent = "Errore nel caricamento.";
  }
}

/**
 * Collega i tasti dell'HTML alle funzioni globali del carrello
 */
function setupCartButtons(p) {
  const btnAdd = document.getElementById("btn-aggiungi");
  const btnRem = document.getElementById("btn-rimuovi");
  const btnPay = document.getElementById("btn-paga-subito");

  // Prepariamo l'oggetto normalizzato per il carrello
  const prodottoCarrello = {
    id: p.id,
    titolo: p.titolo,
    prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
    immagine: p.immagine || p.immagine_url || "/placeholder.webp"
  };

  // Aggiungi al carrello (+)
  if (btnAdd) {
    btnAdd.onclick = () => {
      if (typeof window.aggiungiAlCarrello === "function") {
        window.aggiungiAlCarrello(prodottoCarrello);
      } else {
        console.error("[PRODOTTO] Funzione aggiungiAlCarrello non trovata");
      }
    };
  }

  // Rimuovi unità (-1)
  if (btnRem) {
    btnRem.onclick = () => {
      if (typeof window.rimuoviSingoloDalCarrello === "function") {
        window.rimuoviSingoloDalCarrello(p.id);
      }
    };
  }

  // Acquista Ora (Aggiunge e va al checkout)
  if (btnPay) {
    btnPay.onclick = () => {
      if (typeof window.aggiungiAlCarrello === "function") {
        window.aggiungiAlCarrello(prodottoCarrello);
        window.location.href = "/checkout.html";
      }
    };
  }
}

/* =========================================================
   BOOTSTRAP SINCRONIZZATO
   Si avvia solo quando il loader ha caricato mm-api e carrello
   ========================================================= */
document.addEventListener("critical-ready", () => {
  console.log("🟢 [PRODOTTO] Critical Ready! Avvio logica pagina...");
  caricaDettaglioProdotto();
});

// Fallback di sicurezza: se dopo 3 secondi critical-ready non è arrivato, prova comunque
setTimeout(() => {
  if (typeof window.fetchUniversale === "function" && !document.getElementById("prodotto-titolo").textContent.includes("...")) {
      // Già avviato, non fare nulla
  } else if (window.__criticalReady) {
      caricaDettaglioProdotto();
  }
}, 3000);
