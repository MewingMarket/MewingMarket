// FILE: app/server/index.cjs

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

module.exports = {

  prodotti: {
    ...R("routes/api-prodotti-new.cjs"),
    ...R("routes/prodotti-ai.cjs")
  },

  ai: {
    ...R("routes/api-prodotti-ai.cjs")
  },

  recensioni: {
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  utenti: {
    ...R("routes/api-utenti.cjs"),
    ...R("routes/utenti-evento.cjs")
  },

  ordini: {
    ...R("routes/ordini-utente.cjs")
  },

  paypal: {
    ...R("routes/paypal-create.cjs"),
    ...R("routes/paypal-complete.cjs"),
    ...R("routes/paypal-cancel.cjs"),
    ...R("routes/paypal-ricrea.cjs")
  },

  vendite: {
    ...R("routes/api-vendite-download.cjs")
  },

  rimborso: {
    ...R("routes/rimborso.cjs")
  },

  admin: {
    ...R("routes/api-admin.cjs"),
    ...R("routes/admin-dashboard.cjs"),
    ...R("routes/admin-feedback.cjs"),
    ...R("routes/admin-utenti.cjs"),
    ...R("routes/admin-prodotti-ai.cjs")
  },

  upload: {
    ...R("routes/api-upload.cjs")
  },

  assistenza: {
    ...R("routes/api-assistenza.cjs")
  },

  eventi: {
    ...R("routes/utenti-evento.cjs")
  },

  chat: {
    ...R("routes/chat.cjs"),
    ...R("routes/chat-voice.cjs"),
    ...R("routes/chat-attachment.cjs")
  },

  newsletter: {
    ...R("routes/newsletter.cjs")
  },

  diagnostica: {
    ...R("routes/diagnostica-fetch.cjs")
  },

  generico: {
    ...R("routes/generico.cjs")
  },

  jslist: {
    ...R("routes/jslist.cjs")
  },

  /* ============================================================
     GAME — SALVATAGGIO E CARICAMENTO PARTITA
  ============================================================ */
  game: {
    ...R("routes/game.cjs")
  }

};
