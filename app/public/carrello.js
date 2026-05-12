/* =========================================================
   FILE: /public/carrello.js
   CARRELLO SQL-READY — MODELLO DEFINITIVO (PATCH 2055)
   Fix: ordine eventi + rimozione DOMContentLoaded
========================================================= */

window.Cart = window.Cart || {
  key: "mewing_cart",

  get() {
    try {
      const raw = localStorage.getItem(this.key);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  save(items) {
    try {
      localStorage.setItem(this.key, JSON.stringify(items));
    } catch (err) {
      console.warn("[CART] Impossibile salvare il carrello:", err);
    }
    triggerCartUpdate();
  },

  add(product) {
    const items = this.get();
    const idCercato = product.id;
    const existing = items.find(p => p.id == idCercato);

    const prezzoCent = Number(product.prezzo_cent) || 0;

    if (existing) {
      existing.qty = (Number(existing.qty) || 1) + 1;
    } else {
      items.push({
        id: idCercato,
        titolo: product.titolo,
        prezzo_cent: prezzoCent,
        prezzo: prezzoCent / 100,
        immagine: product.immagine,
        qty: 1
      });
    }

    this.save(items);
  },

  remove(id) {
    const items = this.get().filter(p => p.id != id);
    this.save(items);
  },

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

  setQty(id, qty) {
    const items = this.get();
    const p = items.find(i => i.id == id);
    if (!p) return;

    p.qty = Math.max(1, Number(qty) || 1);
    this.save(items);
  },

  clear() {
    this.save([]);
  },

  total() {
    const items = this.get();
    const sum = items.reduce((s, p) => {
      const pc = Number(p.prezzo_cent) || 0;
      const q = Number(p.qty) || 1;
      return s + (pc * q);
    }, 0);
    return sum / 100;
  },

  count() {
    return this.get().reduce((sum, p) => sum + (Number(p.qty) || 1), 0);
  },

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
  window.Cart.add(prodotto);
}

function rimuoviDalCarrello(id) {
  window.Cart.remove(id);
}

function rimuoviSingoloDalCarrello(id) {
  window.Cart.updateQty(id, -1);
}

function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const count = window.Cart.count();
  badge.textContent = count;

  badge.style.display = count > 0 ? "inline-block" : "none";
}

document.addEventListener("click", (e) => {
  const id = e.target.id;
  if (id === "cart-icon" || id === "cart-badge") {
    window.location.href = "checkout.html";
  }
});

document.addEventListener("cart-updated", aggiornaBadgeCarrello);
document.addEventListener("header-loaded", aggiornaBadgeCarrello);
document.addEventListener("auth-ready", aggiornaBadgeCarrello);

// RIMOSSO: DOMContentLoaded (non affidabile con critical 2055)

// Evento finale, emesso dopo aver registrato tutti gli handler
document.dispatchEvent(new Event("cart-ready"));
