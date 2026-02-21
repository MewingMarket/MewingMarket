/* =========================================================
   CARRELLO — gestione locale del carrello utente
   Versione Premium: sicura, pulita, compatibile con checkout.js
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
    } catch (err) {
      console.error("Errore lettura carrello:", err);
      return [];
    }
  },

  /* -----------------------------------------
     SALVA CARRELLO
  ----------------------------------------- */
  save(cart) {
    try {
      localStorage.setItem(this.key, JSON.stringify(cart));
    } catch (err) {
      console.error("Errore salvataggio carrello:", err);
    }
  },

  /* -----------------------------------------
     AGGIUNGI PRODOTTO
  ----------------------------------------- */
  add(product) {
    const cart = this.get();

    // Evita duplicati (stesso slug)
    if (!cart.some(p => p.slug === product.slug)) {
      cart.push(product);
      this.save(cart);
    }
  },

  /* -----------------------------------------
     RIMUOVI PRODOTTO
  ----------------------------------------- */
  remove(slug) {
    const cart = this.get().filter(p => p.slug !== slug);
    this.save(cart);
  },

  /* -----------------------------------------
     SVUOTA CARRELLO
  ----------------------------------------- */
  clear() {
    localStorage.removeItem(this.key);
  }
};
