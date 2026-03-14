/* =========================================================
   FILE: /public/carrello.js
   CARRELLO PREMIUM — MODELLO COMANDA RISTORANTE (SQL READY)
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
     SALVA CARRELLO
  ----------------------------------------- */
  save(items) {
    localStorage.setItem(this.key, JSON.stringify(items));
    triggerCartUpdate();
  },

  /* -----------------------------------------
     AGGIUNGI PRODOTTO (qty++)
  ----------------------------------------- */
  add(product) {
    const items = this.get();
    const existing = items.find(p => p.slug === product.slug);

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      items.push({
        slug: product.slug,
        titolo: product.titolo,
        prezzo: Number(product.prezzo),
        immagine: product.immagine,
        qty: 1
      });
    }

    this.save(items);
  },

  /* -----------------------------------------
     RIMUOVI PRODOTTO COMPLETAMENTE
  ----------------------------------------- */
  remove(slug) {
    const items = this.get().filter(p => p.slug !== slug);
    this.save(items);
  },

  /* -----------------------------------------
     CAMBIA QUANTITÀ (+1 / -1)
  ----------------------------------------- */
  updateQty(slug, delta) {
    const items = this.get();
    const p = items.find(i => i.slug === slug);
    if (!p) return;

    p.qty = (p.qty || 1) + delta;

    if (p.qty <= 0) {
      this.remove(slug);
      return;
    }

    this.save(items);
  },

  /* -----------------------------------------
     SET QUANTITÀ DIRETTA
  ----------------------------------------- */
  setQty(slug, qty) {
    const items = this.get();
    const p = items.find(i => i.slug === slug);
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
  ----------------------------------------- */
  total() {
    return this.get().reduce((sum, p) => sum + p.prezzo * (p.qty || 1), 0);
  },

  /* -----------------------------------------
     NUMERO TOTALE ARTICOLI
  ----------------------------------------- */
  count() {
    return this.get().reduce((sum, p) => sum + (p.qty || 1), 0);
  },

  /* -----------------------------------------
     PAYLOAD PER CHECKOUT SQL
     (compatibile con ordini-sql.cjs)
  ----------------------------------------- */
  getForCheckout() {
    return this.get().map(p => ({
      slug: p.slug,
      titolo: p.titolo,
      qty: p.qty,
      prezzo: p.prezzo,
      totale: p.prezzo * p.qty
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

function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const count = Cart.count();
  badge.textContent = count;
}

document.addEventListener("cart-updated", aggiornaBadgeCarrello);
document.addEventListener("header-loaded", aggiornaBadgeCarrello);
