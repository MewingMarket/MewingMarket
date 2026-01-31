// modules/context.js — VERSIONE MAX

// Contesto pagina (MAX MODE)
const contextStore = {};

/*
  Struttura salvata per ogni utente:
  {
    page: "/pagina-attuale",
    slug: "slug-prodotto",
    ts: 1730000000000   // timestamp ultimo aggiornamento
  }
*/

module.exports = {
  // Aggiorna contesto utente
  update(uid, page, slug) {
    if (!contextStore[uid]) contextStore[uid] = {};

    if (page) contextStore[uid].page = page;
    if (slug) contextStore[uid].slug = slug;

    // timestamp ultimo aggiornamento
    contextStore[uid].ts = Date.now();
  },

  // Recupera contesto utente
  get(uid) {
    const ctx = contextStore[uid] || {};

    // Se il contesto è troppo vecchio (> 30 minuti), reset
    if (ctx.ts && Date.now() - ctx.ts > 30 * 60 * 1000) {
      contextStore[uid] = {};
      return {};
    }

    return ctx;
  },

  // Reset manuale (se mai servisse)
  reset(uid) {
    contextStore[uid] = {};
  }
};
