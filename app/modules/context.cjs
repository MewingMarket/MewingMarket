// modules/context.js — VERSIONE MAX (blindata)

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

/* =========================================================
   FUNZIONI DI SICUREZZA
========================================================= */
function safeUID(uid) {
  return typeof uid === "string" || typeof uid === "number" ? String(uid) : null;
}

function safeContext(uid) {
  const id = safeUID(uid);
  if (!id) return null;

  if (!contextStore[id] || typeof contextStore[id] !== "object") {
    contextStore[id] = {};
  }

  return contextStore[id];
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  // Aggiorna contesto utente
  update(uid, page, slug) {
    const ctx = safeContext(uid);
    if (!ctx) return;

    if (page && typeof page === "string") ctx.page = page;
    if (slug && typeof slug === "string") ctx.slug = slug;

    ctx.ts = Date.now();
  },

  // Recupera contesto utente
  get(uid) {
    const ctx = safeContext(uid);
    if (!ctx) return {};

    // Se il contesto è troppo vecchio (> 30 minuti), reset
    if (ctx.ts && Date.now() - ctx.ts > 30 * 60 * 1000) {
      contextStore[uid] = {};
      return {};
    }

    return ctx;
  },

  // Reset manuale (se mai servisse)
  reset(uid) {
    const id = safeUID(uid);
    if (!id) return;
    contextStore[id] = {};
  }
};
