/* =========================================================
   INDEX DELLE FUNZIONI — Versione 2027.20 (patch completa)
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

module.exports = {

  prodotti: {
    ...R("routes/api-prodotti-new.cjs"),
    ...R("routes/prodotti-ai.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  utenti: {
    ...R("routes/api-utenti.cjs"),
    ...R("routes/utenti-evento.cjs")   // <-- aggiunto
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

  recensioni: {
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  rimborso: {
    ...R("routes/rimborso.cjs")
  },

  admin: {
    ...R("routes/api-admin.cjs"),
    ...R("routes/admin-dashboard.cjs"),
    ...R("routes/admin-feedback.cjs"),
    ...R("routes/admin-utenti.cjs")
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
    ...R("routes/chat.cjs"),           // <-- aggiunto
    ...R("routes/chat-voice.cjs"),     // <-- aggiunto
    ...R("routes/chat-attachment.cjs") // <-- aggiunto
  },

  newsletter: {
    ...R("routes/newsletter.cjs")      // <-- aggiunto
  },
diagnostica: {
  ...R("routes/diagnostica-fetch.cjs")
},
};
