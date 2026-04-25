/* =========================================================
   FILE: /public/carrello.js
   CARRELLO SQL-READY — MODELLO DEFINITIVO (PATCH 2027.300)
   - Nessuna API → nessun fetchCritico necessario
   - Micro‑patch robustezza senza cambiare logica
   - FIX: Sincronizzazione funzioni globali per catalogo/prodotto
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
    // Assicuriamoci che l'ID sia trattato come stringa o numero in modo coerente
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

  /* -----------------------------------------
     RIMUOVI PRODOTTO COMPLETAMENTE
  ----------------------------------------- */
  remove(id) {
    const items = this.get().filter(p => p.id != id);
    this.save(items);
  },

  /* -----------------------------------------
     CAMBIA QUANTITÀ (+1 / -1)
  ----------------------------------------- */
  updateQty(id, delta) {
    const items = this.get();
    const p = items.find(i => i.id == id);
    if (!p) return;

    p.qty = (Number(p.qty) || 1) + delta;

    if (p.qty <= 0) {
      this.remove(id); // Se scende a 0 o meno, rimuove del tutto
      return;
    }

    this.save(items);
  },

  /* -----------------------------------------
     SET QUANTITÀ DIRETTA
  ----------------------------------------- */
  setQty(id, qty) {
    const items = this.get();
    const p = items.find(i => i.id == id);
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
      return s + (pc * q);
    }, 0);
    return sum / 100;
  },

  /* -----------------------------------------
     NUMERO TOTALE ARTICOLI (per badge)
  ----------------------------------------- */
  count() {
    return this.get().reduce((sum, p) => sum + (Number(p.qty) || 1), 0);
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
   EVENTI E FUNZIONI GLOBALI (Interfaccia per HTML/JS)
========================================================= */

function triggerCartUpdate() {
  document.dispatchEvent(new Event("cart-updated"));
}

// Chiamata da Catalogo e Pagina Prodotto (+)
function aggiungiAlCarrello(prodotto) {
  Cart.add(prodotto);
}

// Chiamata da Checkout (Cestino/Delete)
function rimuoviDalCarrello(id) {
  Cart.remove(id);
}

// Chiamata da Catalogo e Pagina Prodotto (-)
// FIX: Implementata per scalare solo di 1 unità
function rimuoviSingoloDalCarrello(id) {
  Cart.updateQty(id, -1);
}

/* =========================================================
   BADGE CARRELLO — LOGICA DEFINITIVA
========================================================= */
function aggiornaBadgeCarrello() {
  const badge = document.getElementById("cart-badge");
  if (!badge) return;

  const path = location.pathname.toLowerCase();
  // Se siamo in home spesso il badge è nascosto per design, 
  // ma lo lasciamo attivo se preferisci vederlo sempre
  const isHome = path === "/" || path.endsWith("/index.html") || path.endsWith("/index");

  if (isHome) {
    // badge.style.display = "none"; // Decommenta se vuoi nasconderlo in home
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
   EVENTI DI SINCRONIZZAZIONE
========================================================= */
document.addEventListener("cart-updated", aggiornaBadgeCarrello);
document.addEventListener("header-loaded", aggiornaBadgeCarrello);
document.addEventListener("auth-ready", aggiornaBadgeCarrello);

// Badge al caricamento immediato
document.addEventListener("DOMContentLoaded", aggiornaBadgeCarrello);

/* =========================================================
   CART-READY — Segnala che Cart è pronto per gli altri script
========================================================= */
document.dispatchEvent(new Event("cart-ready"));
