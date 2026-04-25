/* =========================================================
   PRODOTTO.JS — MODELLO DEFINITIVO (SYNC SQL)
   PATCH 2027.500 — Full Compatibility
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.error("[PRODOTTO] ID Prodotto mancante nell'URL");
    return;
  }

  try {
    // 1) Fetch dei dati dal nuovo endpoint SQL tramite fetchUniversale
    // Puntiamo a /api/products/ per coerenza con il router backend
    const res = await window.fetchUniversale(`/api/products/${id}`, {
      method: "GET"
    }, { retries: 3 });

    const data = await res.json();

    // Il backend risponde con { success: true, prodotto: {...} }
    // Gestiamo entrambi i casi per sicurezza
    const p = data.prodotto || data;

    if (!p || !p.id) {
      console.error("[PRODOTTO] Dati non validi");
      const container = document.querySelector(".pagina-standard");
      if (container) container.innerHTML = "<h1>Prodotto non trovato</h1>";
      return;
    }

    // 2) Update UI
    document.title = `${p.titolo} | MewingMarket`;
    
    const elTitolo = document.getElementById("prodotto-titolo");
    const elPrezzo = document.getElementById("prodotto-prezzo");
    const elDesc = document.getElementById("prodotto-descrizione");
    const elImg = document.getElementById("prodotto-immagine");

    if (elTitolo) elTitolo.textContent = p.titolo;
    
    // Pulisce HTML e inietta descrizione lunga
    if (elDesc) {
      elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "Nessuna descrizione disponibile.";
    }
    
    // Gestione prezzo: trasforma centesimi SQL in formato Euro decimale
    if (elPrezzo) {
      const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (Number(p.prezzo) || 0).toFixed(2);
      elPrezzo.textContent = `€${prezzoEuro}`;
    }

    // Fallback immagine: controlla sia 'immagine' che 'immagine_url' dal DB
    if (elImg) {
      elImg.src = p.immagine || p.immagine_url || "/placeholder.webp";
      elImg.alt = p.titolo;
    }

    // 3) Configurazione Bottoni Carrello
    setupCartButtons(p);

    console.log("[PRODOTTO] Render completato per:", p.titolo);

  } catch (err) {
    console.error("[PRODOTTO] Errore caricamento:", err);
    const elDesc = document.getElementById("prodotto-descrizione");
    if (elDesc) elDesc.textContent = "Errore durante il recupero dei dati dal server.";
  }
}

function setupCartButtons(p) {
  const btnAdd = document.getElementById("btn-aggiungi");
  const btnRem = document.getElementById("btn-rimuovi");
  const btnPay = document.getElementById("btn-paga-subito");

  // Aggiungi al carrello (+)
  if (btnAdd) {
    btnAdd.onclick = () => {
      if (window.aggiungiAlCarrello) {
        window.aggiungiAlCarrello({
          id: p.id,
          titolo: p.titolo,
          prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
          immagine: p.immagine || p.immagine_url
        });
        alert("Aggiunto al carrello!");
      }
    };
  }

  // Rimuovi unità (-1)
  if (btnRem) {
    btnRem.onclick = () => {
      if (window.rimuoviSingoloDalCarrello) {
        window.rimuoviSingoloDalCarrello(p.id);
        alert("Rimosso 1 unità.");
      }
    };
  }

  // Acquista Ora (Redirect a Checkout)
  if (btnPay) {
    btnPay.onclick = () => {
      if (window.aggiungiAlCarrello) {
        window.aggiungiAlCarrello({
          id: p.id,
          titolo: p.titolo,
          prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
          immagine: p.immagine || p.immagine_url
        });
        window.location.href = "checkout.html";
      }
    };
  }
}

// Avvio automatico
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", caricaDettaglioProdotto);
} else {
  caricaDettaglioProdotto();
}
