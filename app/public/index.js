/* =========================================================
   HOME PREMIUM — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
   PATCH 2051 — ANTI-LOOP (LOCK ESECUZIONE)
========================================================= */

console.log("📌 [HOME] File caricato nel DOM");

/* =========================================================
   🔒 PATCH ANTI-LOOP 2051
   Impedisce che home-premium.js venga eseguito più volte
   quando loaderuniversale/dynamic-loader ricaricano il DOM.
========================================================= */
if (window.__HOME_PREMIUM_RUNNING__) {
  console.warn("🏁 [HOME] già in esecuzione → skip");
  return;
}
window.__HOME_PREMIUM_RUNNING__ = true;

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
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaHomepage() {
  console.log("🔥 home-premium.js READY — Avvio sezioni homepage");

  /* ------------------------------
     1) GRID HOMEPAGE (Top 3 Prodotti)
  ------------------------------ */
  (async () => {
    console.log("📦 [HOME] Carico Top 3 prodotti…");

    const grid = document.getElementById("products-grid");
    if (!grid) {
      console.warn("❌ [HOME] #products-grid NON trovato");
      return;
    }

    const data = await apiHome("/api/prodotti/getProdotti", { method: "GET" });

    console.log("📥 [HOME] Risposta prodotti:", data);

    if (!data) {
      grid.innerHTML = `<p class="info-msg">Il catalogo prodotti è in fase di aggiornamento.</p>`;
      return;
    }

    const products = Array.isArray(data)
      ? data
      : (data.prodotti || data.data || []);

    if (products.length === 0) {
      grid.innerHTML = `<p class="info-msg">Il catalogo prodotti è in fase di aggiornamento.</p>`;
      return;
    }

    grid.innerHTML = "";

    products.slice(0, 3).forEach((p) => {
      const img = p.immagine_url || p.immagine || "/placeholder.webp";
      const titolo = p.titolo || "Prodotto";
      const descrizione = p.descrizione_breve || "";
      const prezzo = (Number(p.prezzo_cent || 0) / 100).toFixed(2);
      const id = p.id;

      const vId = p.youtube_video_id || p.video_id;
      const linkYouTube = vId
        ? `<a href="https://www.youtube.com/watch?v=${vId}" target="_blank" class="yt-link-home">📺 Guarda video su YouTube</a>`
        : "";

      const card = document.createElement("article");
      card.className = "product-card";
      card.innerHTML = `
        <div class="img-container">
          <img src="${img}" alt="${titolo}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${titolo}</h3>
          <p class="desc-breve">${descrizione}</p>
          ${linkYouTube}
          <p class="price">€${prezzo}</p>

          <div class="card-buttons">
            <a href="prodotto.html?id=${id}" class="btn-dettagli" style="width: 100%; text-align: center;">Scopri di più</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  })();

  /* ------------------------------
     2) SLIDER HERO (Immagini dinamiche da SQL)
  ------------------------------ */
  (async () => {
    console.log("🖼️ [HOME] Carico slider hero…");

    const dataHero = await apiHome("/api/prodotti/getProdotti", { method: "GET" });

    if (!dataHero) {
      console.warn("⚠️ [HOME] Nessun dato per slider");
      return;
    }

    const productsHero = Array.isArray(dataHero)
      ? dataHero
      : (dataHero.prodotti || []);

    const images = productsHero
      .map(p => p.immagine_url || p.immagine)
      .filter(img => img && img.length > 5);

    console.log("🖼️ [HOME] Immagini slider:", images.length);

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
  })();
}
