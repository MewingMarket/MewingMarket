/* =========================================================
   CATALOGO — VERSIONE FINALE SINCRONIZZATA
   Include: Rendering, Mapping SQL e Filtri Prezzo
========================================================= */

const clean = (t) => typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";

// 1. HTML della Card
function cardHTML(p) {
    if (!p) return "";
    const id = p.id;
    const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
    const img = p.immagine_url || p.immagine || "/placeholder.webp";
    const prezzoEuro = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
    const desc = clean(p.descrizione_breve || "");
    const vId = p.youtube_video_id || p.video_id;
    
    const linkYT = vId ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Guarda Video</a>` : "";

    return `
    <div class="product-card" data-id="${id}" data-prezzo-cent="${p.prezzo_cent || 0}">
      <div class="img-container"><img src="${img}" alt="${titolo}" loading="lazy"></div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
        ${linkYT}
        <p class="prezzo">€${prezzoEuro}</p>
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width:100%; text-align:center;">Scopri</a>
        </div>
      </div>
    </div>`;
}

// 2. Funzione Principale
async function avviaIlCatalogoOra() {
    // Cerchiamo l'id "catalogo" perché è quello che hai scritto nel tuo HTML
    const grid = document.getElementById("catalogo") || 
                 document.getElementById("grid-prodotti") || 
                 document.querySelector(".catalogo-grid");
    
    if (!grid) {
        console.error("❌ Errore: Contenitore prodotti non trovato!");
        return;
    }

    try {
        console.log("🛠️ Recupero prodotti in corso...");
        const res = await fetch("/api/products");
        const data = await res.json();
        
        const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);

        if (prodotti.length === 0) {
            grid.innerHTML = "<p>Nessun prodotto disponibile.</p>";
            return;
        }

        // Memorizziamo i prodotti globalmente per i filtri
        window.prodottiOriginali = prodotti;

        // Rendering iniziale
        grid.innerHTML = prodotti.map(p => cardHTML(p)).join("");
        console.log("✅ Catalogo pronto.");

        // Attiviamo i filtri se presenti
        setupFiltriCatalogo();

    } catch (err) {
        console.error("🔥 Errore caricamento:", err);
        grid.innerHTML = "<p>Errore di connessione al database.</p>";
    }
}

// 3. Logica Filtri (Fino a 10€, 20€, ecc.)
function setupFiltriCatalogo() {
    const tastiFiltro = document.querySelectorAll(".btn-filtro");
    const grid = document.getElementById("catalogo") || document.getElementById("grid-prodotti");

    tastiFiltro.forEach(btn => {
        btn.onclick = () => {
            const limiteEuro = btn.getAttribute("data-prezzo");
            
            // Se è il tasto reset
            if (btn.id === "reset" || !limiteEuro) {
                grid.innerHTML = window.prodottiOriginali.map(p => cardHTML(p)).join("");
                return;
            }

            // Filtriamo
            const limiteCent = Number(limiteEuro) * 100;
            const filtrati = window.prodottiOriginali.filter(p => (p.prezzo_cent || 0) <= limiteCent);

            if (filtrati.length === 0) {
                grid.innerHTML = "<p>Nessun prodotto in questa fascia di prezzo.</p>";
            } else {
                grid.innerHTML = filtrati.map(p => cardHTML(p)).join("");
            }
        };
    });
}

// 4. Avvio Sincronizzato
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
    avviaIlCatalogoOra();
}
document.addEventListener("critical-ready", avviaIlCatalogoOra);
