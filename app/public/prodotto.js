/* =========================================================
   PRODOTTO.JS — UNIVERSAL JSON PATCH 2027.970
   SQL SYNC + YouTube + Acquista Ora
   PATCH 2057 — PROMO SOLO PER CHI LE HA + FIX API
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

  // Ritorno l'oggetto intero, non solo data
  return json;
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

  if (typeof caricaDettaglioProdotto === "function") {
    caricaDettaglioProdotto();
  } else {
    console.warn("❌ [PRODOTTO] caricaDettaglioProdotto() NON definita");
  }
}

/* =========================================================
   ⭐ PATCH PROMO — PRODOTTO PERSONALIZZATO (Java-mode)
   - Usa promo SOLO se:
   - utente loggato
   - ha promo attiva
   - poi chiama /api/catalogo/personalizzato
========================================================= */
async function getProdottoPersonalizzato(id) {
  try {
    console.log("🎯 [PRODOTTO] Verifica promo per prodotto ID:", id);

    // 1) Controllo utente loggato
    const me = await apiProdotto("/api/auth/me", { method: "GET" });
    const user = me && (me.user || me.data || null);
    const isLogged = !!user;

    if (!isLogged) {
      console.log("👤 [PRODOTTO] Utente NON loggato → niente promo");
      return null;
    }

    console.log("👤 [PRODOTTO] Utente loggato:", user.id || user.email || "OK");

    // 2) Controllo promo attiva
    const promoRes = await apiProdotto("/api/promo/attiva", {
      method: "GET"
    });

    const hasPromo = promoRes && (promoRes.promo || promoRes.data);

    if (!hasPromo) {
      console.log("🎯 [PRODOTTO] Nessuna promo attiva → niente prodotto personalizzato");
      return null;
    }

    console.log("🎯 [PRODOTTO] Promo attiva trovata → richiedo catalogo personalizzato");

    // 3) Catalogo personalizzato
    const catRes = await apiProdotto("/api/catalogo/personalizzato", {
      method: "GET"
    });

    if (!catRes) {
      console.log("ℹ️ [PRODOTTO] Nessun catalogo personalizzato disponibile");
      return null;
    }

    const prodotti = Array.isArray(catRes)
      ? catRes
      : catRes.prodotti || catRes.data || [];

    if (!prodotti || !prodotti.length) {
      console.log("ℹ️ [PRODOTTO] Catalogo personalizzato vuoto");
      return null;
    }

    const p = prodotti.find((x) => String(x.id) === String(id));

    if (p && p.promo_attiva) {
      console.log("🎉 [PRODOTTO] Promo attiva → uso prodotto personalizzato");
      return p;
    }

    console.log("ℹ️ [PRODOTTO] Nessuna promo attiva per questo ID");
    return null;
  } catch (err) {
    console.warn("⚠️ [PRODOTTO] Errore prodotto personalizzato:", err);
    return null;
  }
}

/* =========================================================
   ⭐ PATCH PROMO — RENDER PRODOTTO
========================================================= */
function renderProdotto(p) {
  console.log("🎨 [PRODOTTO] renderProdotto()", p);

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

  if (p.promo_scadenza) {
    const countdown = document.createElement("div");
    countdown.className = "promo-countdown";
    countdown.dataset.scadenza = p.promo_scadenza;
    elPrezzo.insertAdjacentElement("afterend", countdown);
    initCountdownProdotto();
  }
}

/* =========================================================
   ⭐ PATCH PROMO — COUNTDOWN
========================================================= */
function initCountdownProdotto() {
  const el = document.querySelector(".promo-countdown");
  if (!el) return;

  function update() {
    const end = new Date(el.dataset.scadenza);
    const now = new Date();
    const diff = end - now;

    if (diff <= 0) {
      el.textContent = "Promo scaduta";
      return;
    }

    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);

    el.textContent = `Termina tra ${h}h ${m}m`;
  }

  update();
  setInterval(update, 60000);
}

/* =========================================================
   ⭐ PATCH PROMO — OVERRIDE caricaDettaglioProdotto()
   - Se promo valida → usa prodotto personalizzato
   - Altrimenti → fallback alla versione SQL originale
========================================================= */
if (typeof caricaDettaglioProdotto === "function") {
  const _caricaDettaglioProdottoOriginale = caricaDettaglioProdotto;

  caricaDettaglioProdotto = async function () {
    console.log("🧪 [PRODOTTO] Patch PROMO attiva");

    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    if (!id) {
      console.warn("⚠️ [PRODOTTO] Nessun ID prodotto in querystring");
      return _caricaDettaglioProdottoOriginale();
    }

    const promoProdotto = await getProdottoPersonalizzato(id);
    if (promoProdotto) {
      console.log("🟢 [PRODOTTO] Uso versione personalizzata");
      renderProdotto(promoProdotto);
      setupAcquistoDiretto(promoProdotto);
      return;
    }

    console.log("⚪ [PRODOTTO] Nessuna promo → uso SQL normale");
    await _caricaDettaglioProdottoOriginale();
  };
} else {
  console.warn("⚠️ [PRODOTTO] caricaDettaglioProdotto originale NON definita, patch PROMO non applicata");
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
      prezzo_cent: p.promo_attiva
        ? p.prezzo_scontato_cent
        : p.prezzo_cent || Math.round(Number(p.prezzo) * 100),
      immagine: p.immagine_url || p.immagine || "/placeholder.webp"
    };

    console.log("📦 [PRODOTTO] Aggiungo al carrello:", prodCarrello);

    if (typeof window.aggiungiAlCarrello === "function") {
      window.aggiungiAlCarrello(prodCarrello);
    }

    window.location.href = "checkout.html";
  };
}
