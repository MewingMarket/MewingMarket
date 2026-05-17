/* =========================================================
   CATALOGO — UNIVERSAL JSON PATCH 2027.970
   PATCH 2053 — Java-mode + Promo + Fix endpoint
========================================================= */

console.log("📌 [CATALOGO] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050
========================================================= */
(function autorun() {
  console.log("🚀 [CATALOGO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [CATALOGO] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [CATALOGO] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  if (!window.__criticalReady) {
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  avviaCatalogo();
}

/* =========================================================
   CLEAN
========================================================= */
const clean = (t) =>
  typeof t === "string"
    ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
    : "";

/* =========================================================
   COUNTDOWN PROMO
========================================================= */
let countdownTimer = null;

function initCountdown() {
  if (countdownTimer) clearInterval(countdownTimer);

  const els = document.querySelectorAll(".promo-countdown");
  if (!els.length) return;

  const update = () => {
    const now = new Date();
    els.forEach((el) => {
      const iso = el.dataset.scadenza;
      if (!iso) return;

      const end = new Date(iso);
      const diff = end - now;

      if (diff <= 0) {
        el.textContent = "Promo scaduta";
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      el.textContent = `Termina tra ${h}h ${m}m`;
    });
  };

  update();
  countdownTimer = setInterval(update, 60000);
}

/* =========================================================
   ⭐ CATALOGO PERSONALIZZATO (Java-mode)
========================================================= */
async function getCatalogoPersonalizzato() {
  try {
    console.log("🎯 [CATALOGO] Richiesta catalogo personalizzato…");

    const data = await apiCatalogo("/api/catalogo/getCatalogoPersonalizzato", {
      method: "GET"
    });

    if (!data) return null;

    const prodotti = Array.isArray(data)
      ? data
      : (data.prodotti || data.data || []);

    if (!prodotti.length) return null;

    if (prodotti.some((p) => p.promo_attiva)) {
      console.log("🎉 [CATALOGO] Promo attiva → uso catalogo personalizzato");
      return prodotti;
    }

    return null;
  } catch (err) {
    console.warn("⚠️ [CATALOGO] Errore catalogo personalizzato:", err);
    return null;
  }
}

/* =========================================================
   CARD HTML
========================================================= */
function cardHTML(p) {
  if (!p) return "";

  const id = p.id;
  const titolo = clean(p.titolo_breve || p.titolo || "Prodotto");
  const img = p.immagine_url || p.immagine || "/placeholder.webp";
  const desc = clean(p.descrizione_breve || "");

  const prezzoBaseEuro = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
  const hasPromo = p.promo_attiva && p.prezzo_scontato_cent;
  const prezzoPromoEuro = hasPromo
    ? (Number(p.prezzo_scontato_cent || 0) / 100).toFixed(2)
    : null;

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

  const badgeHtml = p.promo_attiva
    ? `<div class="promo-badge">${clean(p.promo_badge || "Promo")}</div>`
    : "";

  const countdownHtml =
    p.promo_scadenza
      ? `<p class="promo-countdown" data-scadenza="${p.promo_scadenza}"></p>`
      : "";

  const prezzoHtml = hasPromo
    ? `
      <p class="prezzo">
        <span class="prezzo-originale">€${prezzoBaseEuro}</span>
        <span class="prezzo-scontato">€${prezzoPromoEuro}</span>
      </p>`
    : `<p class="prezzo">€${prezzoBaseEuro}</p>`;

  return `
    <div class="product-card" data-cat="${catsAttr}" data-id="${id}">
      <div class="img-container">
        <img src="${img}" alt="${titolo}" loading="lazy">
        ${badgeHtml}
      </div>
      <div class="card-content">
        <h2>${titolo}</h2>
        <p class="desc-breve">${desc}</p>
        ${linkYouTube}
        ${prezzoHtml}
        ${countdownHtml}
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri</a>
          <div class="cart-controls">
            <button class="btn-add-cart"
              onclick="window.aggiungiAlCarrello({id:'${id}', titolo:'${titolo}', prezzo_cent:${p.prezzo_cent}, immagine:'${img}'})">+</button>
            <button class="btn-remove-cart"
              onclick="window.rimuoviSingoloDalCarrello('${id}')">-</button>
          </div>
        </div>
      </div>
    </div>`;
}

/* =========================================================
   API UNIVERSALE
========================================================= */
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
========================================================= */
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

  let prodotti = null;

  // ⭐ Catalogo personalizzato
  const promoCatalogo = await getCatalogoPersonalizzato();
  if (promoCatalogo) {
    prodotti = promoCatalogo;
  } else {
    const data = await apiCatalogo("/api/prodotti/getProdotti", {
      method: "GET"
    });

    if (!data) {
      grid.innerHTML = "<p>Errore nel caricamento del catalogo.</p>";
      return;
    }

    prodotti = Array.isArray(data)
      ? data
      : (data.prodotti || data.data || []);
  }

  window.prodottiOriginali = prodotti;

  grid.innerHTML = prodotti.map((p) => cardHTML(p)).join("");
  initCountdown();

  /* =========================================================
     CATEGORIE
  ========================================================== */
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
========================================================= */
function setupFiltri() {
  console.log("🎛️ [CATALOGO] Setup filtri");

  const grid =
    document.getElementById("catalogo") ||
    document.getElementById("grid-prodotti");

  document.querySelectorAll(".btn-cat").forEach((btn) => {
    btn.onclick = () => {
      document
        .querySelectorAll(".btn-cat")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      const selectedCat = btn.dataset.cat;

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
      initCountdown();
    };
  });

  document.querySelectorAll(".btn-filtro").forEach((btn) => {
    btn.onclick = () => {
      const limite = btn.dataset.prezzo;

      if (btn.id === "reset") {
        grid.innerHTML = window.prodottiOriginali
          .map((p) => cardHTML(p))
          .join("");
        initCountdown();
        return;
      }

      const filtrati = window.prodottiOriginali.filter(
        (p) => p.prezzo_cent / 100 <= Number(limite)
      );

      grid.innerHTML = filtrati.map((p) => cardHTML(p)).join("");
      initCountdown();
    };
  });
}

/* =========================================================
   INIZIALIZZAZIONE
========================================================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", avviaIlCatalogoOra);
} else {
  avviaIlCatalogoOra();
}

document.addEventListener("critical-ready", avviaIlCatalogoOra);
