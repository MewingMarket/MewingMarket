/* =========================================================
   FILE: /public/carrello.js
   CARRELLO SQL-READY — MODELLO DEFINITIVO (PATCH 2056)
   Fix: ordine eventi + rimozione DOMContentLoaded
   Patch Promo: prezzo_scontato_cent + promo_attiva
========================================================= */

window.Cart = window.Cart || {
  key: "mewing_cart",

  /* -----------------------------------------
     GET
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
     SAVE
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
     ADD (PATCH PROMO)
  ----------------------------------------- */
  add(product) {
    const items = this.get();
    const idCercato = product.id;
    const existing = items.find(p => p.id == idCercato);

    // Prezzi
    const prezzoBaseCent = Number(product.prezzo_cent) || 0;

    // Fallback promo intelligente
    const promoFlag = !!product.promo_attiva;
    const prezzoPromoCent = promoFlag
      ? Number(product.prezzo_scontato_cent || prezzoBaseCent)
      : prezzoBaseCent;

    if (existing) {
      existing.qty = (Number(existing.qty) || 1) + 1;
    } else {
      items.push({
        id: idCercato,
        titolo: product.titolo,
        immagine: product.immagine,

        // PATCH PROMO
        prezzo_cent: prezzoPromoCent,          // prezzo effettivo usato nel checkout
        prezzo_originale_cent: prezzoBaseCent, // utile per mostrare prezzo barrato
        promo_attiva: promoFlag,
        prezzo_scontato_cent: promoFlag ? prezzoPromoCent : null,

        qty: 1
      });
    }

    this.save(items);
  },

  /* -----------------------------------------
     REMOVE
  ----------------------------------------- */
  remove(id) {
    const items = this.get().filter(p => p.id != id);
    this.save(items);
  },

  /* -----------------------------------------
     UPDATE QTY
  ----------------------------------------- */
  updateQty(id, delta) {
    const items = this.get();
    const p = items.find(i => i.id == id);
    if (!p) return;

    p.qty = (Number(p.qty) || 1) + delta;

    if (p.qty <= 0) {
      this.remove(id);
      return;
    }

    this.save(items);
  },

  /* -----------------------------------------
     SET QTY
  ----------------------------------------- */
  setQty(id, qty) {
    const items = this.get();
    const p = items.find(i => i.id == id);
    if (!p) return;

    p.qty = Math.max(1, Number(qty) || 1);
    this.save(items);
  },

  /* -----------------------------------------
     CLEAR
  ----------------------------------------- */
  clear() {
    this.save([]);
  },

  /* -----------------------------------------
     TOTAL (PATCH PROMO)
  ----------------------------------------- */
  total() {
    const items = this.get();
    const sum = items.reduce((s, p) => {
      const pc = Number(p.prezzo_cent) || 0;
      const q = Number(p.qty) || 1;
      return s + (pc * q);
    }, 0);
    return sum / 100;
  },

  /* -----------------------------------------
     COUNT
  ----------------------------------------- */
  count() {
    return this.get().reduce((sum, p) => sum + (Number(p.qty) || 1), 0);
  },

  /* -----------------------------------------
     GET FOR CHECKOUT (PATCH PROMO)
  ----------------------------------------- */
  getForCheckout() {
    return this.get().map(p => ({
      prodotto_id: p.id,
      qty: Number(p.qty) || 1,

      // Prezzo effettivo
      prezzo_cent: Number(p.prezzo_cent) || 0,

      // Info utili
      titolo: p.titolo || "",
      immagine: p.immagine || "",

      // PATCH PROMO
      promo_attiva: !!p.promo_attiva,
      prezzo_originale_cent: Number(p.prezzo_originale_cent) || null,
      prezzo_scontato_cent: Number(p.prezzo_scontato_cent) || null
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
  window.Cart.add(prodotto);
}

function rimuoviDalCarrello(id) {
  window.Cart.remove(id);
}

function rimuoviSingoloDalCarrello(id) {
  window.Cart.updateQty(id, -1);
}

/* =========================================================
   BADGE ROBUSTO (PATCH 2056)
========================================================= */
function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");

  if (!badge) {
    // DOM non pronto → ritenta
    document.addEventListener("DOMContentLoaded", aggiornaBadgeCarrello, { once: true });
    return;
  }

  const count = window.Cart.count();
  badge.textContent = count;
  badge.style.display = count > 0 ? "inline-block" : "none";
}

/* =========================================================
   CLICK ICONA CARRELLO
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
   CART-READY (PATCH 2056 — ordinato)
========================================================= */
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    document.dispatchEvent(new Event("cart-ready"));
  });
} else {
  document.dispatchEvent(new Event("cart-ready"));
}
