/* =========================================================
   HOME PREMIUM — UNIVERSAL JSON PATCH 2027.970
   PATCH 2057 — SINGLE FETCH MODE + ANTI-LOOP DEFINITIVO
========================================================= */

console.log("📌 [HOME] File caricato nel DOM");

/* =========================================================
   🔒 PATCH ANTI-LOOP 2051 (LOCK ESECUZIONE)
========================================================= */
(function() {
  if (window.__HOME_PREMIUM_RUNNING__) {
    console.warn("🏁 [HOME] già in esecuzione → skip");
    return;
  }
  window.__HOME_PREMIUM_RUNNING__ = true;
})();

/* =========================================================
   SINGLE FETCH MODE — CACHE PROMISE
========================================================= */
let __CATALOGO_PROMISE__ = null;

async function getCatalogoPersonalizzatoHomeCached() {
  if (__CATALOGO_PROMISE__) {
    console.log("♻️ [HOME] Riutilizzo catalogo personalizzato già in corso");
    return __CATALOGO_PROMISE__;
  }

  console.log("🎯 [HOME] Prima richiesta catalogo personalizzato…");

  __CATALOGO_PROMISE__ = getCatalogoPersonalizzatoHome()
    .catch(err => {
      console.warn("⚠️ [HOME] Errore catalogo personalizzato:", err);
      __CATALOGO_PROMISE__ = null;
      return null;
    });

  return __CATALOGO_PROMISE__;
}

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiHome(path, options = {}) {
  console.log("🌐 [HOME] API:", path);

  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [HOME] Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [HOME] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "/login";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [HOME] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [HOME] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [HOME] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [HOME] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [HOME] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [HOME] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [HOME] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [HOME] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [HOME] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [HOME] critical-ready già presente → avvio homepage");

  avviaHomepage();
}

/* =========================================================
   ⭐ PATCH PROMO — CATALOGO PERSONALIZZATO
========================================================= */
async function getCatalogoPersonalizzatoHome() {
  try {
    console.log("🎯 [HOME] Richiesta catalogo personalizzato…");

    const data = await apiHome("/api/catalogo/getCatalogoPersonalizzato", {
      method: "GET"
    });

    if (!data) return null;

    const prodotti = Array.isArray(data)
      ? data
      : (data.prodotti || data.data || []);

    if (!prodotti.length) return null;

    const conPromo = prodotti.filter(p => p.promo_attiva);
    return conPromo.length ? conPromo : null;

  } catch (err) {
    console.warn("⚠️ [HOME] Errore catalogo personalizzato:", err);
    return null;
  }
}

/* =========================================================
   ⭐ CARD HTML TOP 3
========================================================= */
function cardHTMLHome(p) {
  const img = p.immagine_url || p.immagine || "/placeholder.webp";
  const titolo = p.titolo || "Prodotto";
  const desc = p.descrizione_breve || "";
  const id = p.id;

  const prezzoBase = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
  const prezzoPromo = p.promo_attiva
    ? (Number(p.prezzo_scontato_cent || 0) / 100).toFixed(2)
    : null;

  const badge = p.promo_attiva
    ? `<div class="promo-badge">${p.promo_badge || "Promo"}</div>`
    : "";

  const countdown = p.promo_scadenza
    ? `<p class="promo-countdown" data-scadenza="${p.promo_scadenza}"></p>`
    : "";

  const prezzoHTML = p.promo_attiva
    ? `
      <p class="price">
        <span class="prezzo-originale">€${prezzoBase}</span>
        <span class="prezzo-scontato">€${prezzoPromo}</span>
      </p>
    `
    : `<p class="price">€${prezzoBase}</p>`;

  const vId = p.youtube_video_id || p.video_id;
  const linkYouTube = vId
    ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-home">📺 Guarda video su YouTube</a>`
    : "";

  return `
    <article class="product-card">
      <div class="img-container">
        <img src="${img}" alt="${titolo}" loading="lazy">
        ${badge}
      </div>
      <div class="card-body">
        <h3>${titolo}</h3>
        <p class="desc-breve">${desc}</p>
        ${linkYouTube}
        ${prezzoHTML}
        ${countdown}
        <div class="card-buttons">
          <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width: 100%; text-align: center;">Scopri di più</a>
        </div>
      </div>
    </article>
  `;
}

/* =========================================================
   ⭐ COUNTDOWN HOME
========================================================= */
function initCountdownHome() {
  const els = document.querySelectorAll(".promo-countdown");
  if (!els.length) return;

  function update() {
    const now = new Date();
    els.forEach(el => {
      const end = new Date(el.dataset.scadenza);
      const diff = end - now;

      if (diff <= 0) {
        el.textContent = "Promo scaduta";
        return;
      }

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      el.textContent = `Termina tra ${h}h ${m}m`;
    });
  }

  update();
  setInterval(update, 60000);
}

/* =========================================================
   ⭐ AVVIO HOMEPAGE — SINGLE FETCH MODE
========================================================= */
async function avviaHomepage() {
  console.log("🔥 home-premium.js READY — Avvio sezioni homepage");

  // ============================
  // 1) FETCH UNICA
  // ============================
  let data = await getCatalogoPersonalizzatoHomeCached();
  if (!data) {
    data = await apiHome("/api/prodotti/getProdotti", { method: "GET" });
  }

  if (!data) {
    console.warn("⚠️ [HOME] Nessun dato disponibile");
    return;
  }

  const products = Array.isArray(data)
    ? data
    : (data.prodotti || data.data || []);

  // ============================
  // 2) TOP 3 PRODOTTI
  // ============================
  console.log("📦 [HOME] Rendering Top 3 prodotti…");

  const grid = document.getElementById("products-grid");
  if (grid) {
    grid.innerHTML = "";

    products.slice(0, 3).forEach((p) => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = cardHTMLHome(p);
      grid.appendChild(wrapper.firstElementChild);
    });

    initCountdownHome();
  }

  // ============================
  // 3) SLIDER HERO
  // ============================
  console.log("🖼️ [HOME] Rendering slider hero…");

  const images = products
    .map(p => p.immagine_url || p.immagine)
    .filter(img => img && img.length > 5);

  const slider = document.getElementById("hero-slider");
  if (slider && images.length > 0) {
    let index = 0;
    const rotate = () => {
      slider.style.opacity = 0;
      setTimeout(() => {
        slider.src = images[index];
        slider.style.opacity = 1;
        index = (index + 1) % images.length;
      }, 400);
    };
    rotate();
    setInterval(rotate, 6000);
  }
}
