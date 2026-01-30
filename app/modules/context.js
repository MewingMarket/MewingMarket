// modules/context.js

// Contesto pagina (MAX MODE)
const contextStore = {};

module.exports = {
  update(uid, page, slug) {
    if (!contextStore[uid]) contextStore[uid] = {};
    if (page) contextStore[uid].page = page;
    if (slug) contextStore[uid].slug = slug;
  },

  get(uid) {
    return contextStore[uid] || {};
  }
};
