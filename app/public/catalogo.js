/* =========================================================
   CATALOGO — VERSIONE DEFINITIVA
   Filtri + Categorie + Carrello + YouTube + SQL Mapping
========================================================= */

const clean = (t) => typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";

// 1. HTML della Card
function cardHTML(p) {
    if (!p) return "";
    const id = p.id;
    const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
    const img = p.immagine_url || p.immagine || "/placeholder.webp";
    const prezzoEuro = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
    const pCent = p.prezzo_cent || 0;
    const desc = clean(p.descrizione_breve || "");
    
    // --- PATCH YOUTUBE ---
    const vId = p.youtube_video_id || p.video_id;
    const linkYouTube = vId 
      ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Guarda video</a>` 
      : "";

    // Gestione Categorie
    let catArray = [];
    try {
        catArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []);
    } catch(e) { catArray = []; }
    const catsAttr = catArray.map(c => clean(c)).join(" ");

    return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <div class="img-container"><img src="${img}" alt="${titolo}" loading="lazy"></div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
        ${linkYouTube}
        <p class="prezzo">€${prezzoEuro}</p>
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a>
          <div class="cart-controls">
            <button class="btn-add-cart" 
                    onclick="window.aggiungiAlCarrello({id:'${id}', titolo:'${titolo}', prezzo_cent:${pCent}, immagine:'${img}'})">+</button>
            <button class="btn-remove-cart" 
                    onclick="window.rimuoviSingoloDalCarrello('${id}')">-</button>
          </div>
        </div>
      </div>
    </div>`;
}

// 2. Caricamento Dati
async function avviaIlCatalogoOra() {
    const grid = document.getElementById("catalogo") || document.getElementById("grid-prodotti");
    const catBox = document.getElementById("categorie");
    if (!grid) return;

    try {
        // ⭐ PATCH 2027 — nuovo endpoint Java‑mode
        const res = await fetch("/api/prodotti/getProdotti");
        const data = await res.json();

        const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);
        window.prodottiOriginali = prodotti;

        grid.innerHTML = prodotti.map(p => cardHTML(p)).join("");

        if (catBox) {
            const tutteLeCat = new Set();
            prodotti.forEach(p => {
                let c = [];
                try { 
                    c = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []); 
                } catch(e){}
                c.forEach(cat => tutteLeCat.add(cat));
            });

            catBox.innerHTML = '<button class="btn-cat active" data-cat="all">Tutti</button>';
            tutteLeCat.forEach(cat => {
                catBox.innerHTML += `<button class="btn-cat" data-cat="${cat}">${cat}</button>`;
            });
            setupFiltri();
        }
    } catch (err) {
        console.error("🔥 Errore:", err);
        grid.innerHTML = "<p>Errore nel caricamento del catalogo.</p>";
    }
}

// 3. Setup Filtri
function setupFiltri() {
    const grid = document.getElementById("catalogo") || document.getElementById("grid-prodotti");
    
    document.querySelectorAll(".btn-cat").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".btn-cat").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const selectedCat = btn.getAttribute("data-cat");
            const filtrati = selectedCat === "all" 
                ? window.prodottiOriginali 
                : window.prodottiOriginali.filter(p => {
                    let c = [];
                    try { 
                        c = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []); 
                    } catch(e){}
                    return c.includes(selectedCat);
                });
            grid.innerHTML = filtrati.map(p => cardHTML(p)).join("");
        };
    });

    document.querySelectorAll(".btn-filtro").forEach(btn => {
        btn.onclick = () => {
            const limite = btn.getAttribute("data-prezzo");
            if (btn.id === "reset") {
                grid.innerHTML = window.prodottiOriginali.map(p => cardHTML(p)).join("");
                return;
            }
            const filtrati = window.prodottiOriginali.filter(p => (p.prezzo_cent / 100) <= Number(limite));
            grid.innerHTML = filtrati.map(p => cardHTML(p)).join("");
        };
    });
}

// 4. Inizializzazione
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
    avviaIlCatalogoOra();
}
document.addEventListener("critical-ready", avviaIlCatalogoOra);
