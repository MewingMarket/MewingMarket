/* =========================================================
   FILE: /public/carrello.js
   CARRELLO PREMIUM — MewingMarket
   Versione definitiva: guest + logged, qty, badge, single/multi
========================================================= */

const Cart = {
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
    localStorage.setItem(this.key, JSON.stringify(items));
  },

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

  remove(slug) {
    const items = this.get().filter(p => p.slug !== slug);
    this.save(items);
  },

  clear() {
    this.save([]);
  },

  total() {
    return this.get().reduce((sum, p) => sum + p.prezzo * (p.qty || 1), 0);
  },

  count() {
    return this.get().reduce((sum, p) => sum + (p.qty || 1), 0);
  }
};

/* =========================================================
   FUNZIONI GLOBALI
========================================================= */

function aggiungiAlCarrello(prodotto) {
  Cart.add(prodotto);
}

function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const count = Cart.count();
  badge.textContent = count;
}

function getCheckoutMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get("slug") ? "single" : "multi";
}

function getSingleProduct() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("slug");
  if (!slug) return null;

  const items = Cart.get();
  return items.find(p => p.slug === slug) || null;
}

function isLogged() {
  const session = localStorage.getItem("session");
  const email = localStorage.getItem("utenteEmail");
  return !!(session && email);
}
