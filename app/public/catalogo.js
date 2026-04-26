/* =========================================================
   CATALOGO — VERSIONE COMPLETA (Rendering + Categorie + Carrello)
========================================================= */

const clean = (t) => typeof t === "string" ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim() : "";

// 1. HTML della Card con tasti + e -
function cardHTML(p) {
    if (!p) return "";
    const id = p.id;
    const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
    const img = p.immagine_url || p.immagine || "/placeholder.webp";
    const prezzoEuro = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
    const pCent = p.prezzo_cent || 0;
    const desc = clean(p.descrizione_breve || "");
    
    // Gestione Categorie per il filtro CSS/JS
    let catArray = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []);
    const catsAttr = catArray.map(c => clean(c)).join(" ");

    return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <div class="img-container"><img src="${img}" alt="${titolo}" loading="lazy"></div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
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

// 2. Funzione Principale di Caricamento
async function avviaIlCatalogoOra() {
    const grid = document.getElementById("catalogo") || document.getElementById("grid-prodotti");
    const catBox = document.getElementById("categorie");
    
    if (!grid) return;

    try {
        const res = await fetch("/api/products");
        const data = await res.json();
        const prodotti = Array.isArray(data) ? data : (data.prodotti || data.data || []);

        window.prodottiOriginali = prodotti;

        // Rendering Prodotti
        grid.innerHTML = prodotti.map(p => cardHTML(p)).join("");

        // Rendering Categorie Dinamiche
        if (catBox) {
            const tutteLeCat = new Set();
            prodotti.forEach(p => {
                let c = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []);
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
        grid.innerHTML = "<p>Errore nel caricamento.</p>";
    }
}

// 3. Logica Filtri (Categorie e Prezzo)
function setupFiltri() {
    const grid = document.getElementById("catalogo") || document.getElementById("grid-prodotti");
    
    // Filtro Categorie
    document.querySelectorAll(".btn-cat").forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll(".btn-cat").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            
            const selectedCat = btn.getAttribute("data-cat");
            const filtrati = selectedCat === "all" 
                ? window.prodottiOriginali 
                : window.prodottiOriginali.filter(p => {
                    let c = Array.isArray(p.categoria) ? p.categoria : (p.categoria ? JSON.parse(p.categoria) : []);
                    return c.includes(selectedCat);
                });
            grid.innerHTML = filtrati.map(p => cardHTML(p)).join("");
        };
    });

    // Filtro Prezzo (Bottoni Fino a 10€, ecc.)
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

// 4. Start
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
    avviaIlCatalogoOra();
}
document.addEventListener("critical-ready", avviaIlCatalogoOra);
