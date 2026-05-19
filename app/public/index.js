/* =========================================================
   HOME PREMIUM — UNIVERSAL JSON PATCH 2027.4
   Compatibile con backend 2027.3 + Java‑mode
========================================================= */

console.log("📌 [HOME] File caricato nel DOM");

/* =========================================================
   ANTI-LOOP
========================================================= */
(function () {
  if (window.__HOME_PREMIUM_RUNNING__) return;
  window.__HOME_PREMIUM_RUNNING__ = true;
})();

/* =========================================================
   SINGLE FETCH MODE
========================================================= */
let __CATALOGO_PROMISE__ = null;

async function getCatalogoPersonalizzatoHomeCached() {
  if (__CATALOGO_PROMISE__) return __CATALOGO_PROMISE__;

  __CATALOGO_PROMISE__ = getCatalogoPersonalizzatoHome()
    .catch(err => {
      console.warn("⚠️ [HOME] Errore catalogo personalizzato:", err);
      __CATALOGO_PROMISE__ = null;
      return null;
    });

  return __CATALOGO_PROMISE__;
}

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiHome(path, payload = {}) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => null);
    return json || { success: false };

  } catch (err) {
    console.error("❌ [HOME] Errore rete:", err);
    return { success: false };
  }
}

/* =========================================================
   AUTORUN
========================================================= */
(function autorun() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }
  initPage();
})();

/* =========================================================
   INIT PAGE
========================================================= */
function initPage() {
  if (!window.__criticalReady) {
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }
  avviaHomepage();
}

/* =========================================================
   ⭐ PATCH PROMO — CATALOGO PERSONALIZZATO
========================================================= */
async function getCatalogoPersonalizzatoHome() {
  try {
    // 1) utente loggato?
    const me = await apiHome("/api/utenti/me");
    if (!me.success || !me.utente) return null;

    // 2) promo attiva?
    const promoRes = await apiHome("/api/promo/attiva");
    if (!promoRes.success || !promoRes.promo) return null;

    // 3) catalogo personalizzato
    const catRes = await apiHome("/api/catalogo/personalizzato");
    if (!catRes.success || !Array.isArray(catRes.prodotti)) return null;

    const conPromo = catRes.prodotti.filter(p => p.promo_attiva);
    return conPromo.length ? conPromo : null;

  } catch (err) {
    console.warn("⚠️ [HOME] Errore promo:", err);
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

  const prezzoBase = (p.prezzo_cent / 100).toFixed(2);
  const prezzoPromo = p.promo_attiva
    ? (p.prezzo_scontato_cent / 100).toFixed(2)
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
          <a href="prodotto.html?id=${id}" class="btn-dettagli">Scopri di più</a>
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
   ⭐ AVVIO HOMEPAGE
========================================================= */
async function avviaHomepage() {
  let prodotti = null;

  try {
    // 1) provo catalogo personalizzato
    let data = await getCatalogoPersonalizzatoHomeCached();

    if (!data) {
      // 2) catalogo base
      const baseRes = await apiHome("/api/prodotti-new");
      if (!baseRes.success || !Array.isArray(baseRes.prodotti)) return;

      prodotti = baseRes.prodotti;
    } else {
      prodotti = data;
    }
  } catch (err) {
    console.error("🔥 [HOME] Errore homepage:", err);
    const baseRes = await apiHome("/api/prodotti-new");
    if (!baseRes.success) return;
    prodotti = baseRes.prodotti;
  }

  if (!Array.isArray(prodotti) || !prodotti.length) return;

  // TOP 3
  const grid = document.getElementById("products-grid");
  if (grid) {
    grid.innerHTML = "";
    prodotti.slice(0, 3).forEach(p => {
      const wrapper = document.createElement("div");
      wrapper.innerHTML = cardHTMLHome(p);
      grid.appendChild(wrapper.firstElementChild);
    });
    initCountdownHome();
  }

  // SLIDER HERO
  const images = prodotti
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
