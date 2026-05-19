/* =========================================================
   PRODOTTO.JS — UNIVERSAL JSON PATCH 2027.4
   Compatibile con backend 2027.3
========================================================= */

console.log("📌 [PRODOTTO] File caricato nel DOM");

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiProdotto(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  try {
    const res = await fetch(path, { ...options, headers });
    const json = await res.json().catch(() => null);
    return json || { success: false };
  } catch (err) {
    console.error("❌ [PRODOTTO] Errore rete:", err);
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
  if (typeof caricaDettaglioProdotto === "function") {
    caricaDettaglioProdotto();
  }
}

/* =========================================================
   ⭐ PATCH PROMO — PRODOTTO PERSONALIZZATO
========================================================= */
async function getProdottoPersonalizzato(id) {
  try {
    console.log("🎯 [PRODOTTO] Verifica promo per prodotto:", id);

    // 1) /api/utenti/me (FIX endpoint)
    const me = await apiProdotto("/api/utenti/me", { method: "POST" });
    if (!me.success || !me.utente) {
      console.log("👤 Utente NON loggato → niente promo");
      return null;
    }

    // 2) /api/promo/attiva
    const promoRes = await apiProdotto("/api/promo/attiva", { method: "POST" });
    if (!promoRes.success || !promoRes.promo) {
      console.log("🎯 Nessuna promo attiva");
      return null;
    }

    // 3) /api/catalogo/personalizzato
    const catRes = await apiProdotto("/api/catalogo/personalizzato", {
      method: "POST"
    });

    if (!catRes.success || !Array.isArray(catRes.prodotti)) {
      console.log("ℹ️ Catalogo personalizzato non disponibile");
      return null;
    }

    const p = catRes.prodotti.find(x => String(x.id) === String(id));

    if (p && p.promo_attiva) {
      console.log("🎉 Promo attiva → uso prodotto personalizzato");
      return p;
    }

    return null;
  } catch (err) {
    console.warn("⚠️ Errore prodotto personalizzato:", err);
    return null;
  }
}

/* =========================================================
   ⭐ RENDER PRODOTTO
========================================================= */
function renderProdotto(p) {
  const elTitolo = document.getElementById("prodotto-titolo");
  const elSub = document.getElementById("prodotto-subtitle");
  const elDesc = document.getElementById("prodotto-descrizione");
  const elImg = document.getElementById("prodotto-immagine");
  const elPrezzo = document.getElementById("prodotto-prezzo");
  const heroLeft = document.querySelector(".hero-left");

  if (elTitolo) elTitolo.textContent = p.titolo;
  if (elSub) elSub.textContent = p.descrizione_breve || "";
  if (elDesc) elDesc.innerHTML = p.descrizione_lunga || p.descrizione || "";

  const prezzoBase = (p.prezzo_cent / 100).toFixed(2);
  const prezzoPromo = p.promo_attiva
    ? (p.prezzo_scontato_cent / 100).toFixed(2)
    : null;

  if (elPrezzo) {
    if (p.promo_attiva) {
      elPrezzo.innerHTML = `
        <span class="prezzo-originale">€${prezzoBase}</span>
        <span class="prezzo-scontato">€${prezzoPromo}</span>
      `;
    } else {
      elPrezzo.textContent = `€${prezzoBase}`;
    }
  }

  if (elImg) {
    elImg.src = p.immagine_url || p.immagine || "/placeholder.webp";
  }

  if (p.promo_attiva && heroLeft) {
    const badge = document.createElement("div");
    badge.className = "promo-badge";
    badge.textContent = p.promo_badge || "Promo";
    heroLeft.appendChild(badge);
  }
}

/* =========================================================
   ⭐ OVERRIDE caricaDettaglioProdotto()
========================================================= */
if (typeof caricaDettaglioProdotto === "function") {
  const _old = caricaDettaglioProdotto;

  caricaDettaglioProdotto = async function () {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) return _old();

    const promoProdotto = await getProdottoPersonalizzato(id);

    if (promoProdotto) {
      renderProdotto(promoProdotto);
      setupAcquistoDiretto(promoProdotto);
      return;
    }

    await _old();
  };
}

/* =========================================================
   ACQUISTA ORA
========================================================= */
function setupAcquistoDiretto(p) {
  const btn = document.getElementById("btn-acquista-hero");
  if (!btn) return;

  btn.onclick = () => {
    const prodCarrello = {
      id: p.id,
      titolo: p.titolo,
      prezzo_cent: p.promo_attiva
        ? p.prezzo_scontato_cent
        : p.prezzo_cent,
      immagine: p.immagine_url || p.immagine || "/placeholder.webp"
    };

    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodCarrello);
    }

    window.location.href = "checkout.html";
  };
}
