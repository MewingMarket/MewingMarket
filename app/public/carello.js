/* =========================================================
   FILE: /public/carrello.js
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
     AGGIUNGI PRODOTTO (con quantità)
  ----------------------------------------- */
  add(product) {
    const cart = this.get();
    const existing = cart.find(p => p.slug === product.slug);

    if (existing) {
      existing.qty = (existing.qty || 1) + 1;
    } else {
      cart.push({
        slug: product.slug,
        titolo: product.titolo,
        prezzo: Number(product.prezzo),
        qty: 1
      });
    }

    this.save(cart);
  },

  /* -----------------------------------------
     MODIFICA QUANTITÀ (+ / -)
  ----------------------------------------- */
  updateQty(slug, delta) {
    const cart = this.get();
    const item = cart.find(p => p.slug === slug);
    if (!item) return;

    const newQty = (item.qty || 1) + delta;

    if (newQty <= 0) {
      this.remove(slug);
      return;
    }

    item.qty = newQty;
    this.save(cart);
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
    return this.get().reduce((sum, p) => {
      return sum + Number(p.prezzo || 0) * (p.qty || 1);
    }, 0);
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

  // Se non loggato → solo avviso gentile
  if (!isLogged()) {
    alert("Per completare l'acquisto dovrai fare login in checkout.");
  }
}

/* -----------------------------------------
   AGGIORNA BADGE CARRELLO
----------------------------------------- */
function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const count = Cart.get().reduce((sum, p) => sum + (p.qty || 1), 0);
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
