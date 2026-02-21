/* =========================================================
   CARRELLO PREMIUM — MewingMarket
   Versione definitiva: compatibile con catalogo, prodotto,
   checkout, badge, PayPal e Model A
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
     AGGIUNGI PRODOTTO (senza duplicati)
  ----------------------------------------- */
  add(product) {
    const cart = this.get();

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
  },

  /* -----------------------------------------
     TOTALE CARRELLO
  ----------------------------------------- */
  total() {
    return this.get().reduce((sum, p) => sum + Number(p.prezzo || 0), 0);
  }
};

/* =========================================================
   FUNZIONI UNIVERSALI — usate da TUTTO il sito
========================================================= */

/* -----------------------------------------
   AGGIUNGI AL CARRELLO (funzione globale)
----------------------------------------- */
function aggiungiAlCarrello(product) {
  Cart.add(product);
  aggiornaBadgeCarrello();
}

/* -----------------------------------------
   AGGIORNA BADGE CARRELLO
----------------------------------------- */
function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const count = Cart.get().length;
  badge.textContent = count;
}

/* -----------------------------------------
   MODALITÀ ACQUISTO:
   - "single" → 1 prodotto
   - "multi"  → tutto il carrello
----------------------------------------- */
function getCheckoutMode() {
  const url = new URL(window.location.href);
  const slug = url.searchParams.get("slug");

  if (slug) return "single";
  return "multi";
}

/* -----------------------------------------
   OTTIENI PRODOTTO SINGOLO (per checkout)
----------------------------------------- */
function getSingleProduct() {
  const url = new URL(window.location.href);
  const slug = url.searchParams.get("slug");

  if (!slug) return null;

  const cart = Cart.get();
  return cart.find(p => p.slug === slug) || null;
}
