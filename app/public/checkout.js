/* =========================================================
   CHECKOUT — UNIVERSAL JSON PATCH 2027.970
========================================================= */

console.log("[CHECKOUT] Caricato");

let authOk = false;
let cartOk = false;

/* =========================================================
   EVENTI DI AVVIO
========================================================= */
document.addEventListener("auth-ready", () => {
  authOk = true;
  tryStartCheckout();
});

document.addEventListener("cart-ready", () => {
  cartOk = true;
  tryStartCheckout();
});

function tryStartCheckout() {
  if (authOk && cartOk) initCheckout();
}

/* =========================================================
   WRAPPER UNIVERSALE (token + universal-json)
========================================================= */
async function apiCheckout(path, options = {}) {
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
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
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
   INIT CHECKOUT
========================================================= */
async function initCheckout() {
  console.log("[CHECKOUT] initCheckout()");

  const token = localStorage.getItem("token");
  if (!token) {
    window.location.href = "login.html";
    return;
  }

  // -------------------------------------------------------
  // 1) Verifica utente
  // -------------------------------------------------------
  const me = await apiCheckout("/api/utenti/me", { method: "GET" });
  if (!me || !me.utente) {
    window.location.href = "login.html";
    return;
  }

  const utenteEmail = me.utente.email;
  console.log("[CHECKOUT] Utente verificato:", utenteEmail);

  // -------------------------------------------------------
  // 2) Carica carrello
  // -------------------------------------------------------
  const cart = Cart.get();
  if (!Array.isArray(cart) || cart.length === 0) {
    window.location.href = "catalogo.html";
    return;
  }

  // -------------------------------------------------------
  // 3) Rendering prodotti e calcolo Totale
  // -------------------------------------------------------
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
  const elTotale = document.getElementById("totale");
  const elDaPagare = document.getElementById("da-pagare");

  if (elTotale) elTotale.textContent = totaleEuro;
  if (elDaPagare) elDaPagare.textContent = totaleEuro;

  console.log("[CHECKOUT] Totale Calcolato:", totaleEuro);

  // -------------------------------------------------------
  // 4) Bottone acquista (PayPal)
  // -------------------------------------------------------
  const btn = document.getElementById("btnCheckout");
  if (!btn) return;

  btn.onclick = async () => {
    btn.disabled = true;
    btn.textContent = "Reindirizzamento...";

    const payload = Cart.getForCheckout();

    const data = await apiCheckout("/api/paypal/paypalCreateOrder", {
      method: "POST",
      body: JSON.stringify({
        email: utenteEmail,
        prodotti: payload,
        totale: totaleEuro
      })
    });

    if (data && data.paypalUrl) {
      window.location.href = data.paypalUrl;
      return;
    }

    btn.disabled = false;
    btn.textContent = "Acquista ora";
    alert("Errore PayPal. Impossibile creare l'ordine.");
  };
}
