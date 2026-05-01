/* =========================================================
   PRODOTTO.JS — UNIVERSAL JSON PATCH 2027.970
   SQL SYNC + YouTube + Acquista Ora
========================================================= */

async function apiProdotto(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   CARICA DETTAGLIO PRODOTTO
========================================================= */
async function caricaDettaglioProdotto() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  if (!id) return;

  const data = await apiProdotto(`/api/prodotti/getProdottoById/${id}`, {
    method: "GET"
  });

  if (!data) {
    console.error("🔥 [PRODOTTO] Errore caricamento SQL");
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Errore: Prodotto non disponibile.";
    return;
  }

  const p = data.prodotto || data;

  if (!p || !p.id) {
    const container = document.getElementById("prodotto-descrizione");
    if (container) container.textContent = "Prodotto non trovato.";
    return;
  }

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
    videoIframe.src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`;
    videoSection.style.display = "block";
  } else if (videoSection) {
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

  if (btnAcquista) {
    btnAcquista.onclick = () => {
      const prodCarrello = {
        id: p.id,
        titolo: p.titolo,
        prezzo_cent: p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
        immagine: p.immagine_url || p.immagine || "/placeholder.webp"
      };

      console.log("🛒 Aggiunta al carrello e reindirizzamento...");

      if (typeof window.aggiungiAlCarrello === "function") {
        window.aggiungiAlCarrello(prodCarrello);
      }

      window.location.href = "checkout.html";
    };
  }
}

/* =========================================================
   AVVIO
========================================================= */
document.addEventListener("critical-ready", caricaDettaglioProdotto);
