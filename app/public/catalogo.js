/* =========================================================
   CATALOGO — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [CATALOGO] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [CATALOGO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [CATALOGO] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [CATALOGO] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [CATALOGO] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [CATALOGO] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE DELLA PAGINA
// =========================================================
function initPage() {
  console.log("🏁 [CATALOGO] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [CATALOGO] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [CATALOGO] critical-ready già presente → avvio catalogo");

  avviaCatalogo();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
function avviaCatalogo() {
  console.log("🔥 catalogo.js READY");

  /* =========================================================
     CLEAN
  ========================================================== */
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  /* =========================================================
     CARD HTML
  ========================================================== */
  function cardHTML(p) {
    if (!p) return "";
    const id = p.id;
    const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
    const img = p.immagine_url || p.immagine || "/placeholder.webp";
    const prezzoEuro = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
    const pCent = p.prezzo_cent || 0;
    const desc = clean(p.descrizione_breve || "");

    const vId = p.youtube_video_id || p.video_id;
    const linkYouTube = vId
      ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-card">📺 Guarda video</a>`
      : "";

    let catArray = [];
    try {
      catArray = Array.isArray(p.categoria)
        ? p.categoria
        : p.categoria
        ? JSON.parse(p.categoria)
        : [];
    } catch (e) {
      catArray = [];
    }
    const catsAttr = catArray.map((c) => clean(c)).join(" ");

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

  /* =========================================================
     API UNIVERSALE
  ========================================================== */
  async function apiCatalogo(path, options = {}) {
    console.log("🌐 [CATALOGO] API:", path);

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ [CATALOGO] Errore rete:", err);
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [CATALOGO] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [CATALOGO] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     CARICAMENTO CATALOGO
  ========================================================== */
  async function avviaIlCatalogoOra() {
    console.log("📥 [CATALOGO] Carico catalogo…");

    const grid =
      document.getElementById("catalogo") ||
      document.getElementById("grid-prodotti");
    const catBox = document.getElementById("categorie");
    if (!grid) {
      console.warn("❌ [CATALOGO] grid-prodotti NON trovato");
      return;
    }

    const data = await apiCatalogo("/api/prodotti/getProdotti", {
      method: "GET"
    });

    if (!data) {
      console.warn("❌ [CATALOGO] Nessun dato ricevuto");
      grid.innerHTML = "<p>Errore nel caricamento del catalogo.</p>";
      return;
    }

    const prodotti = Array.isArray(data)
      ? data
      : data.prodotti || data.data || [];

    console.log("🟢 [CATALOGO] Prodotti caricati:", prodotti.length);

    window.prodottiOriginali = prodotti;

    grid.innerHTML = prodotti.map((p) => cardHTML(p)).join("");

    if (catBox) {
      const tutteLeCat = new Set();
      prodotti.forEach((p) => {
        let c = [];
        try {
          c = Array.isArray(p.categoria)
            ? p.categoria
            : p.categoria
            ? JSON.parse(p.categoria)
            : [];
        } catch (e) {}
        c.forEach((cat) => tutteLeCat.add(cat));
      });

      catBox.innerHTML =
        '<button class="btn-cat active" data-cat="all">Tutti</button>';
      tutteLeCat.forEach((cat) => {
        catBox.innerHTML += `<button class="btn-cat" data-cat="${cat}">${cat}</button>`;
      });

      setupFiltri();
    }
  }

  /* =========================================================
     FILTRI
  ========================================================== */
  function setupFiltri() {
    console.log("🎛️ [CATALOGO] Setup filtri");

    const grid =
      document.getElementById("catalogo") ||
      document.getElementById("grid-prodotti");

    document.querySelectorAll(".btn-cat").forEach((btn) => {
      btn.onclick = () => {
        console.log("🔎 [CATALOGO] Filtro categoria:", btn.dataset.cat);

        document
          .querySelectorAll(".btn-cat")
          .forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");

        const selectedCat = btn.getAttribute("data-cat");

        const filtrati =
          selectedCat === "all"
            ? window.prodottiOriginali
            : window.prodottiOriginali.filter((p) => {
                let c = [];
                try {
                  c = Array.isArray(p.categoria)
                    ? p.categoria
                    : p.categoria
                    ? JSON.parse(p.categoria)
                    : [];
                } catch (e) {}
                return c.includes(selectedCat);
              });

        grid.innerHTML = filtrati.map((p) => cardHTML(p)).join("");
      };
    });

    document.querySelectorAll(".btn-filtro").forEach((btn) => {
      btn.onclick = () => {
        const limite = btn.getAttribute("data-prezzo");
        console.log("💶 [CATALOGO] Filtro prezzo:", limite);

        if (btn.id === "reset") {
          grid.innerHTML = window.prodottiOriginali
            .map((p) => cardHTML(p))
            .join("");
          return;
        }

        const filtrati = window.prodottiOriginali.filter(
          (p) => p.prezzo_cent / 100 <= Number(limite)
        );

        grid.innerHTML = filtrati.map((p) => cardHTML(p)).join("");
      };
    });
  }

  /* =========================================================
     INIZIALIZZAZIONE
  ========================================================== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
  } else {
    avviaIlCatalogoOra();
  }

  document.addEventListener("critical-ready", avviaIlCatalogoOra);
}
