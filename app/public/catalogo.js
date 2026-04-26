/* =========================================================
   CATALOGO — FIX DEFINITIVO (Rendering Forzato)
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
          <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a>
        </div>
      </div>
    </div>`;
}

// 3. Funzione Core di Caricamento e Rendering
async function avviaIlCatalogoOra() {
    const grid = document.getElementById("grid-prodotti") || document.querySelector(".products-grid") || document.getElementById("products-grid");
    
    if (!grid) {
        console.error("❌ Errore: Contenitore griglia non trovato nel DOM!");
        return;
    }

    try {
        console.log("🛠️ Inizio recupero dati...");
        const res = await fetch("/api/products");
        const data = await res.json();
        
        console.log("📦 Dati pronti per il rendering:", data);

        const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);

        if (prodotti.length === 0) {
            grid.innerHTML = "<p>Nessun prodotto trovato.</p>";
            return;
        }

        // DISEGNA LE CARD
        grid.innerHTML = prodotti.map(p => cardHTML(p)).join("");
        console.log("✅ Rendering completato con successo!");

    } catch (err) {
        console.error("🔥 Errore durante il rendering:", err);
        grid.innerHTML = "<p>Errore nel caricamento dei prodotti.</p>";
    }
}

// 4. Esecuzione Multi-Livello (per essere sicuri che parta)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
    avviaIlCatalogoOra();
}

// Supporto per il tuo sistema critical-ready se presente
document.addEventListener("critical-ready", avviaIlCatalogoOra);
