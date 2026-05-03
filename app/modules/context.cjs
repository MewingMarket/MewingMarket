/**
 * =========================================================
 * File: app/modules/context.cjs
 * SCOPO: Gestione contesto pagina per utenti reali
 * Usato dal middleware context.cjs
 * =========================================================
 */

// PATCH DEBUG — appare SEMPRE, anche se il middleware crasha
console.log("### CONTEXT_MODULE_LOADED ###", __filename);

const store = new Map();

/**
 * Aggiorna il contesto dell’utente
 */
function update(uid, page) {
  // ESCLUSIONE STATICI — NON aggiornare contesto per file statici
  if (/\.(js|css|html|png|jpg|jpeg|svg|webp|ico|woff|woff2)(\?|$)/.test(page || "")) {
    return;
  }

  // PATCH DEBUG — log ogni update
  console.log("### CONTEXT_UPDATE ###", { uid, page });

  if (!uid) return; // utente anonimo → ignora

  const prev = store.get(uid) || {};

  const next = {
    ...prev,
    page: page || prev.page || null,
    updatedAt: Date.now()
  };

  store.set(uid, next);
}

/**
 * Recupera contesto
 */
function get(uid) {
  // PATCH DEBUG — log ogni get
  console.log("### CONTEXT_GET ###", { uid });

  return store.get(uid) || null;
}

module.exports = {
  update,
  get
};
