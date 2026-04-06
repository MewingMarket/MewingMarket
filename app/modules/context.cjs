/**
 * =========================================================
 * File: app/modules/context.cjs
 * SCOPO: Gestione contesto pagina per utenti reali
 * Usato dal middleware context.cjs
 * =========================================================
 */

const store = new Map();

/**
 * Aggiorna il contesto dell’utente
 */
function update(uid, page) {
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
  return store.get(uid) || null;
}

module.exports = {
  update,
  get
};
