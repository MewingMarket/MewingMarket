// FILE: app/server/index.lazy.cjs
// Router universale LAZY — nessun require al boot

const path = require("path");

function lazyRoute(relPath) {
  return async () => {
    const full = path.join(process.cwd(), "app/server", relPath);
    return require(full);
  };
}

module.exports = {

  prodotti: [
    lazyRoute("routes/api-prodotti-new.cjs"),
    lazyRoute("routes/prodotti-ai.cjs"),
    lazyRoute("routes/product-page.cjs")
  ],

  catalogo: [
    lazyRoute("routes/catalogo-personalizzato.cjs")
  ],

  ai: [
    lazyRoute("routes/api-prodotti-ai.cjs")
  ],

  recensioni: [
    lazyRoute("routes/api-feedback.cjs"),
    lazyRoute("routes/api-recensioni-top.cjs"),
    lazyRoute("routes/meta-feed.cjs")
  ],

  utenti: [
    lazyRoute("routes/api-utenti.cjs"),
    lazyRoute("routes/utenti-evento.cjs")
  ],

  ordini: [
    lazyRoute("routes/ordini-utente.cjs")
  ],

  paypal: [
    lazyRoute("routes/paypal-create.cjs"),
    lazyRoute("routes/paypal-complete.cjs"),
    lazyRoute("routes/paypal-cancel.cjs"),
    lazyRoute("routes/paypal-ricrea.cjs")
  ],

  vendite: [
    lazyRoute("routes/api-vendite-download.cjs")
  ],

  rimborso: [
    lazyRoute("routes/rimborso.cjs")
  ],

  admin: [
    lazyRoute("routes/api-admin.cjs"),
    lazyRoute("routes/admin-dashboard.cjs"),
    lazyRoute("routes/admin-feedback.cjs"),
    lazyRoute("routes/admin-utenti.cjs"),
    lazyRoute("routes/admin-prodotti-ai.cjs")
  ],

  upload: [
    lazyRoute("routes/api-upload.cjs")
  ],

  assistenza: [
    lazyRoute("routes/api-assistenza.cjs")
  ],

  eventi: [
    lazyRoute("routes/utenti-evento.cjs")
  ],

  chat: [
    lazyRoute("routes/chat-unified.cjs")
  ],

  newsletter: [
    lazyRoute("routes/newsletter.cjs")
  ],

  diagnostica: [
    lazyRoute("routes/diagnostica-fetch.cjs")
  ],

  generico: [
    lazyRoute("routes/generico.cjs")
  ],

  jslist: [
    lazyRoute("routes/jslist.cjs")
  ],

  game: [
    lazyRoute("routes/game.cjs")
  ],

  promo: [
    lazyRoute("routes/promo.cjs")
  ],

  sitemap: [
    lazyRoute("routes/sitemap.cjs")
  ],

  auth: [
    lazyRoute("routes/auth.cjs")
  ]

};
