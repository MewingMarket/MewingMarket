/* =========================================================
   CATALOGO — FIX DEFINITIVO (Anti-Errore DOM)
========================================================= */

// 1. Funzione di pulizia testo
const clean = (t) => typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";

// 2. Generazione HTML della Card
function cardHTML(p) {
    if (!p) return "";
    const id = p.id;
    const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
    const img = p.immagine_url || p.immagine || "/placeholder.webp";
    const prezzo = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
    const desc = clean(p.descrizione_breve || "");
    const vId = p.youtube_video_id || p.video_id;
    
    const linkYT = vId ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Video YouTube</a>` : "";

    return `
    <div class="product-card" data-id="${id}">
      <div class="img-container"><img src="${img}" alt="${titolo}"></div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
        ${linkYT}
        <p class="prezzo">€${prezzo}</p>
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width:100%; text-align:center;">Scopri</a>
        </div>
      </div>
    </div>`;
}

// 3. Funzione Core di Caricamento e Rendering
async function avviaIlCatalogoOra() {
    // Cerchiamo il contenitore con tutti i nomi possibili
    let grid = document.getElementById("grid-prodotti") || 
               document.querySelector(".products-grid") || 
               document.getElementById("products-grid");
    
    // AUTO-RIPARAZIONE: Se non trova la griglia, la crea dentro il tag <main>
    if (!grid) {
        console.warn("⚠️ Contenitore non trovato. Tento creazione automatica...");
        const main = document.querySelector("main") || document.body;
        grid = document.createElement("div");
        grid.id = "grid-prodotti";
        grid.className = "products-grid";
        main.appendChild(grid);
    }

    try {
        console.log("🛠️ Inizio recupero dati con standard fetch...");
        // Usiamo fetch standard per bypassare i crash di fetchUniversale/fetchCritico
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error(`Errore Server: ${res.status}`);
        
        const data = await res.json();
        const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);

        if (prodotti.length === 0) {
            grid.innerHTML = "<p class='info-msg'>Nessun prodotto disponibile al momento.</p>";
            return;
        }

        // DISEGNA LE CARD
        grid.innerHTML = prodotti.map(p => cardHTML(p)).join("");
        console.log("✅ Rendering completato!");

    } catch (err) {
        console.error("🔥 Errore nel flusso catalogo:", err);
        grid.innerHTML = "<p>Servizio momentaneamente non disponibile.</p>";
    }
}

// 4. Esecuzione Multi-Livello (Sicurezza Totale)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
    avviaIlCatalogoOra();
}

// Supporto per il tuo sistema se lancia l'evento dopo
document.addEventListener("critical-ready", avviaIlCatalogoOra);
