/* =========================================================
   FILE: /public/carrello.js
   CARRELLO SQL-READY — MODELLO DEFINITIVO
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
    const existing = items.find(p => p.id === product.id);

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      items.push({
        id: product.id,
        slug: product.slug,
        titolo: product.titolo,
        prezzo_cent: product.prezzo_cent,
        prezzo: product.prezzo_cent / 100,
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
  ----------------------------------------- */
  total() {
    return this.get().reduce((sum, p) => sum + (p.prezzo_cent * p.qty), 0) / 100;
  },

  /* -----------------------------------------
     NUMERO TOTALE ARTICOLI
  ----------------------------------------- */
  count() {
    return this.get().reduce((sum, p) => sum + (p.qty || 1), 0);
  },

  /* -----------------------------------------
     PAYLOAD PER CHECKOUT SQL
  ----------------------------------------- */
  getForCheckout() {
    return this.get().map(p => ({
      prodotto_id: p.id,
      prezzo_cent: p.prezzo_cent,
      qty: p.qty,
      titolo: p.titolo,
      immagine: p.immagine
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

function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return; // ⭐ evita errori su pagine senza badge

  const count = Cart.count();
  badge.textContent = count;

  if (count > 0) {
    badge.style.display = "inline-block";
  } else {
    badge.style.display = "none";
  }
}

// Aggiorna badge quando:
// - il carrello cambia
// - l’header viene caricato
// - l’utente fa login/logout
document.addEventListener("cart-updated", aggiornaBadgeCarrello);
document.addEventListener("header-loaded", aggiornaBadgeCarrello);
document.addEventListener("auth-ready", aggiornaBadgeCarrello);
