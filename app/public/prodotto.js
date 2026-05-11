/* =========================================================
   PRODOTTO.JS — UNIVERSAL JSON PATCH 2027.970
   SQL SYNC + YouTube + Acquista Ora
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [PRODOTTO] File caricato nel DOM");

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiProdotto(path, options = {}) {
  console.log("🌐 [PRODOTTO] API:", path);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [PRODOTTO] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [PRODOTTO] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [PRODOTTO] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [PRODOTTO] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [PRODOTTO] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [PRODOTTO] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [PRODOTTO] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [PRODOTTO] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [PRODOTTO] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [PRODOTTO] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [PRODOTTO] critical-ready già presente → avvio caricamento prodotto");

  caricaDettaglioProdotto();
}

/* =========================================================
   CARICA DETTAGLIO PRODOTTO (TUO CODICE ORIGINALE)
========================================================= */
async function caricaDettaglioProdotto() {
  console.log("📥 [PRODOTTO] Avvio caricamento dettaglio…");

  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");

  if (!id) {
    console.warn("⚠️ [PRODOTTO] Nessun ID prodotto nella URL");
    return;
  }

  const data = await apiProdotto(`/api/prodotti/getProdottoById/${id}`, {
    method: "GET"
  });

  console.log("📦 [PRODOTTO] Risposta API:", data);

  if (!data) {
    console.error("🔥 [PRODOTTO] Errore caricamento SQL");
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Errore: Prodotto non disponibile.";
    return;
  }

  const p = data.prodotto || data;

  if (!p || !p.id) {
    console.warn("❌ [PRODOTTO] Prodotto non trovato");
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Prodotto non trovato.";
    return;
  }

  console.log("🟢 [PRODOTTO] Prodotto caricato:", p);

  /* =========================================================
     1) Update UI
  ========================================================== */
  document.title = `${p.titolo} | MewingMarket`;

  const elTitolo = document.getElementById("prodotto-titolo");
  const elSub = document.getElementById("prodotto-subtitle");
  const elDesc = document.getElementById("prodotto-descrizione");
  const elImg = document.getElementById("prodotto-immagine");
  const elPrezzo = document.getElementById("prodotto-prezzo");

  if (elTitolo) elTitolo.textContent = p.titolo;
  if (elSub) elSub.textContent = p.descrizione_breve || "";
  if (elDesc) elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "";

  const prezzoEuro = p.prezzo_cent
    ? (p.prezzo_cent / 100).toFixed(2)
    : Number(p.prezzo || 0).toFixed(2);

  if (elPrezzo) elPrezzo.textContent = `€${prezzoEuro}`;

  if (elImg) {
    elImg.src = p.immagine_url || p.immagine || "/placeholder.webp";
  }

  /* =========================================================
     2) Video YouTube
  ========================================================== */
  const videoId = p.youtube_video_id || p.video_id;
  const videoSection = document.getElementById("video-section");
  const videoIframe = document.getElementById("prodotto-video");

  if (videoId && videoSection && videoIframe) {
    console.log("🎬 [PRODOTTO] Video YouTube:", videoId);
    videoIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    videoSection.style.display = "block";
  } else if (videoSection) {
    console.log("🎬 [PRODOTTO] Nessun video disponibile");
    videoSection.style.display = "none";
  }

  /* =========================================================
     3) Acquista Ora
  ========================================================== */
  setupAcquistoDiretto(p);
}

/* =========================================================
   ACQUISTA ORA → Carrello + Checkout
========================================================= */
function setupAcquistoDiretto(p) {
  const btnAcquista = document.getElementById("btn-acquista-hero");

  if (!btnAcquista) {
    console.warn("⚠️ [PRODOTTO] btn-acquista-hero NON trovato");
    return;
  }

  btnAcquista.onclick = () => {
    console.log("🛒 [PRODOTTO] Click su Acquista Ora");

    const prodCarrello = {
      id: p.id,
      titolo: p.titolo,
      prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
      immagine: p.immagine_url || p.immagine || "/placeholder.webp"
    };

    console.log("📦 [PRODOTTO] Aggiungo al carrello:", prodCarrello);

    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodCarrello);
    }

    window.location.href = "checkout.html";
  };
}
