/* =========================================================
   FILE: /public/carrello.js
   CARRELLO SQL-READY — MODELLO DEFINITIVO (PATCH 2027.300)
   - Nessuna API → nessun fetchCritico necessario
   - Micro‑patch robustezza senza cambiare logica
========================================================= */

const Cart = {
  key: "mewing_cart",

  /* -----------------------------------------
     LEGGI CARRELLO
  ----------------------------------------- */
  get() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /* -----------------------------------------
     SALVA CARRELLO (patch: fallback silenzioso)
  ----------------------------------------- */
  save(items) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch (err) {
      console.warn("[CART] Impossibile salvare il carrello:", err);
    }
    triggerCartUpdate();
  },

  /* -----------------------------------------
     AGGIUNGI PRODOTTO (qty++)
     PATCH: rimosso slug + normalizzazione prezzo_cent
  ----------------------------------------- */
  add(product) {
    const items = this.get();
    const existing = items.find(p => p.id === product.id);

    const prezzoCent = Number(product.prezzo_cent) || 0;

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      items.push({
        id: product.id,
        titolo: product.titolo,
        prezzo_cent: prezzoCent,
        prezzo: prezzoCent / 100,
        immagine: product.immagine,
        qty: 1
      });
    }

    this.save(items);
  },

  /* -----------------------------------------
     RIMUOVI PRODOTTO COMPLETAMENTE
  ----------------------------------------- */
  remove(id) {
    const items = this.get().filter(p => p.id !== id);
    this.save(items);
  },

  /* -----------------------------------------
     CAMBIA QUANTITÀ (+1 / -1)
  ----------------------------------------- */
  updateQty(id, delta) {
    const items = this.get();
    const p = items.find(i => i.id === id);
    if (!p) return;

    p.qty = (p.qty || 1) + delta;

    if (p.qty <= 0) {
      this.remove(id);
      return;
    }

    this.save(items);
  },

  /* -----------------------------------------
     SET QUANTITÀ DIRETTA
  ----------------------------------------- */
  setQty(id, qty) {
    const items = this.get();
    const p = items.find(i => i.id === id);
    if (!p) return;

    p.qty = Math.max(1, Number(qty) || 1);
    this.save(items);
  },

  /* -----------------------------------------
     SVUOTA CARRELLO
  ----------------------------------------- */
  clear() {
    this.save([]);
  },

  /* -----------------------------------------
     TOTALE €
     PATCH: protezione contro NaN
  ----------------------------------------- */
  total() {
    const items = this.get();
    const sum = items.reduce((s, p) => {
      const pc = Number(p.prezzo_cent) || 0;
      const q = Number(p.qty) || 1;
      return s + pc * q;
    }, 0);
    return sum / 100;
  },

  /* -----------------------------------------
     NUMERO TOTALE ARTICOLI
  ----------------------------------------- */
  count() {
    return this.get().reduce((sum, p) => sum + (p.qty || 1), 0);
  },

  /* -----------------------------------------
     PAYLOAD PER CHECKOUT SQL
     PATCH: protezione prodotti corrotti
  ----------------------------------------- */
  getForCheckout() {
    return this.get().map(p => ({
      prodotto_id: p.id,
      prezzo_cent: Number(p.prezzo_cent) || 0,
      qty: Number(p.qty) || 1,
      titolo: p.titolo || "",
      immagine: p.immagine || ""
    }));
  }
};

/* =========================================================
   EVENTI GLOBALI
========================================================= */

function triggerCartUpdate() {
  document.dispatchEvent(new Event("cart-updated"));
}

function aggiungiAlCarrello(prodotto) {
  Cart.add(prodotto);
}

function rimuoviDalCarrello(id) {
  Cart.remove(id);
}

/* =========================================================
   BADGE CARRELLO — LOGICA DEFINITIVA
========================================================= */
function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const path = location.pathname.toLowerCase();
  const isHome =
    path === "/" ||
    path.endsWith("/index.html") ||
    path.endsWith("/index");

  if (isHome) {
    badge.style.display = "none";
    return;
  }

  const count = Cart.count();
  badge.textContent = count;

  if (count > 0) {
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

/* =========================================================
   CLICK SU CARRELLO → CHECKOUT
========================================================= */
document.addEventListener("click", (e) => {
  const id = e.target.id;
  if (id === "cart-icon" || id === "cart-badge") {
    window.location.href = "checkout.html";
  }
});

/* =========================================================
   EVENTI
========================================================= */
document.addEventListener("cart-updated", aggiornaBadgeCarrello);
document.addEventListener("header-loaded", aggiornaBadgeCarrello);
document.addEventListener("auth-ready", aggiornaBadgeCarrello);

/* =========================================================
   CART-READY — Segnala che Cart è pronto
========================================================= */
document.dispatchEvent(new Event("cart-ready"));
