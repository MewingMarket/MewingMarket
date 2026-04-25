/* =========================================================
   PRODOTTO.JS — MODELLO DEFINITIVO (SYNC SQL)
   ========================================================= */

async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.error("ID Prodotto mancante nell'URL");
    return;
  }

  try {
    // 1) Fetch dei dati dal nuovo endpoint SQL
    const res = await window.fetchUniversale(`/products/${id}`);
    const data = await res.json();

    // Il backend ora risponde con { success: true, prodotto: {...} }
    const p = data.prodotto || data;

    if (!p || !p.id) {
      document.body.innerHTML = "<h1>Prodotto non trovato</h1>";
      return;
    }

    // 2) Update UI
    document.title = `${p.titolo} | MewingMarket`;
    
    const elTitolo = document.getElementById("prodotto-titolo");
    const elPrezzo = document.getElementById("prodotto-prezzo");
    const elDesc = document.getElementById("prodotto-descrizione");
    const elImg = document.getElementById("prodotto-immagine");

    if (elTitolo) elTitolo.textContent = p.titolo;
    if (elDesc) elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "Nessuna descrizione.";
    
    if (elPrezzo) {
      const prezzoEuro = p.prezzo_cent ? (p.prezzo_cent / 100).toFixed(2) : (p.prezzo || "0.00");
      elPrezzo.textContent = `€${prezzoEuro}`;
    }

    if (elImg) {
      elImg.src = p.immagine || "/placeholder.webp";
      elImg.alt = p.titolo;
    }

    // 3) Configurazione Bottoni Carrello
    setupCartButtons(p);

  } catch (err) {
    console.error("Errore caricamento prodotto:", err);
    alert("Errore durante il caricamento dei dati.");
  }
}

function setupCartButtons(p) {
  const btnAdd = document.getElementById("btn-aggiungi");
  const btnRem = document.getElementById("btn-rimuovi");
  const btnPay = document.getElementById("btn-paga-subito");

  // Aggiungi (+)
  if (btnAdd) {
    btnAdd.onclick = () => {
      if (window.aggiungiAlCarrello) {
        window.aggiungiAlCarrello({
          id: p.id,
          titolo: p.titolo,
          prezzo_cent: p.prezzo_cent || Math.round(p.prezzo * 100),
          immagine: p.immagine
        });
        alert("Aggiunto al carrello!");
      }
    };
  }

  // Rimuovi (-1)
  if (btnRem) {
    btnRem.onclick = () => {
      if (window.rimuoviSingoloDalCarrello) {
        window.rimuoviSingoloDalCarrello(p.id);
        alert("Rimosso 1 unità.");
      }
    };
  }

  // Acquista Ora (Redirect diretto a Checkout)
  if (btnPay) {
    btnPay.onclick = () => {
      if (window.aggiungiAlCarrello) {
        window.aggiungiAlCarrello(p);
        window.location.href = "checkout.html";
      }
    };
  }
}

// Avvio
document.addEventListener("DOMContentLoaded", caricaDettaglioProdotto);
// Fallback se DOMContentLoaded è già passato
if (document.readyState === "complete" || document.readyState === "interactive") {
    caricaDettaglioProdotto();
}
