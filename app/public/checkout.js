/* =========================================================
   CHECKOUT — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [CHECKOUT] File caricato nel DOM");

// Stato eventi
let authOk = false;
let cartOk = false;

// =========================================================
// AUTORUN 2050 — parte SEMPRE
// =========================================================
(function autorun() {
  console.log("🚀 [CHECKOUT] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [CHECKOUT] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [CHECKOUT] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [CHECKOUT] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [CHECKOUT] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE
// =========================================================
function initPage() {
  console.log("🏁 [CHECKOUT] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [CHECKOUT] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [CHECKOUT] critical-ready già presente → avvio listener auth/cart");

  avviaListenersCheckout();
}

// =========================================================
// LISTENER ORIGINALI INCAPSULATI
// =========================================================
function avviaListenersCheckout() {
  console.log("🎧 [CHECKOUT] Attivo listener auth-ready e cart-ready");

  document.addEventListener("auth-ready", () => {
    console.log("🔓 [CHECKOUT] auth-ready ricevuto");
    authOk = true;
    tryStartCheckout();
  });

  document.addEventListener("cart-ready", () => {
    console.log("🛒 [CHECKOUT] cart-ready ricevuto");
    cartOk = true;
    tryStartCheckout();
  });
}

function tryStartCheckout() {
  console.log("⏩ [CHECKOUT] tryStartCheckout → authOk:", authOk, "cartOk:", cartOk);
  if (authOk && cartOk) {
    console.log("🟢 [CHECKOUT] Condizioni soddisfatte → initCheckout()");
    initCheckout();
  }
}

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiCheckout(path, options = {}) {
  console.log("🌐 [CHECKOUT] API:", path);

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
    console.error("❌ [CHECKOUT] Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    console.warn("🔒 [CHECKOUT] Token scaduto → redirect login");
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [CHECKOUT] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [CHECKOUT] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}

/* =========================================================
   INIT CHECKOUT
========================================================= */
async function initCheckout() {
  console.log("🔥 [CHECKOUT] initCheckout() AVVIATO");

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("🔒 [CHECKOUT] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  // -------------------------------------------------------
  // 1) Verifica utente
  // -------------------------------------------------------
  console.log("👤 [CHECKOUT] Verifico utente…");
  const me = await apiCheckout("/api/utenti/me", { method: "GET" });

  if (!me || !me.utente) {
    console.warn("❌ [CHECKOUT] Utente NON valido → redirect login");
    window.location.href = "login.html";
    return;
  }

  const utenteEmail = me.utente.email;
  console.log("🟢 [CHECKOUT] Utente verificato:", utenteEmail);

  // -------------------------------------------------------
  // 2) Carica carrello
  // -------------------------------------------------------
  console.log("🛒 [CHECKOUT] Carico carrello…");
  const cart = Cart.get();

  if (!Array.isArray(cart) || cart.length === 0) {
    console.warn("⚠️ [CHECKOUT] Carrello vuoto → redirect catalogo");
    window.location.href = "catalogo.html";
    return;
  }

  // -------------------------------------------------------
  // 3) Rendering prodotti e calcolo Totale
  // -------------------------------------------------------
  console.log("🧮 [CHECKOUT] Calcolo totale…");

  const container = document.getElementById("checkout-container");
  let totaleCent = 0;

  if (container) {
    container.innerHTML = cart
      .map((item) => {
        const pc = Number(item.prezzo_cent) || 0;
        const q = Number(item.qty) || 1;
        totaleCent += pc * q;

        const prezzo = (pc / 100).toFixed(2);
        const subtotal = ((pc * q) / 100).toFixed(2);

        return `
          <div class="checkout-item">
            <img src="${item.immagine || '/placeholder.webp'}" alt="${item.titolo}">
            <div class="info">
              <h3>${item.titolo}</h3>
              <p>Prezzo: €${prezzo}</p>
              <p>Quantità: ${q}</p>
              <p>Subtotale: <strong>€${subtotal}</strong></p>
            </div>
          </div>
        `;
      })
      .join("");
  }

  const totaleEuro = (totaleCent / 100).toFixed(2);
  console.log("💶 [CHECKOUT] Totale calcolato:", totaleEuro);

  const elTotale = document.getElementById("totale");
  const elDaPagare = document.getElementById("da-pagare");

  if (elTotale) elTotale.textContent = totaleEuro;
  if (elDaPagare) elDaPagare.textContent = totaleEuro;

  // -------------------------------------------------------
  // 4) Bottone acquista (PayPal)
  // -------------------------------------------------------
  const btn = document.getElementById("btnCheckout");
  if (!btn) {
    console.warn("⚠️ [CHECKOUT] btnCheckout NON trovato");
    return;
  }

  btn.onclick = async () => {
    console.log("💳 [CHECKOUT] Click su Acquista ora");

    btn.disabled = true;
    btn.textContent = "Reindirizzamento...";

    const payload = Cart.getForCheckout();
    console.log("📦 [CHECKOUT] Payload ordine:", payload);

    const data = await apiCheckout("/api/paypal/paypalCreateOrder", {
      method: "POST",
      body: JSON.stringify({
        email: utenteEmail,
        prodotti: payload,
        totale: totaleEuro
      })
    });

    console.log("📨 [CHECKOUT] Risposta PayPal:", data);

    if (data && data.paypalUrl) {
      console.log("➡️ [CHECKOUT] Redirect a PayPal");
      window.location.href = data.paypalUrl;
      return;
    }

    console.error("❌ [CHECKOUT] Errore PayPal");
    btn.disabled = false;
    btn.textContent = "Acquista ora";
    alert("Errore PayPal. Impossibile creare l'ordine.");
  };
}
