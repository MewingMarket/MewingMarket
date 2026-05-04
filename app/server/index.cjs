/* =========================================================
   INDEX DELLE FUNZIONI — Versione 2028.200 (NO CONFLITTI)
   Compatibile con:
   - router universale 2028.100
   - universal-json
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

module.exports = {

  /* =========================================================
     PRODOTTI / CATALOGO
  ========================================================== */
  prodotti: {
    ...R("routes/api-prodotti-new.cjs"),
    ...R("routes/prodotti-ai.cjs")
  },

  /* =========================================================
     RECENSIONI / FEEDBACK PUBBLICI
  ========================================================== */
  recensioni: {
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  /* =========================================================
     UTENTI
  ========================================================== */
  utenti: {
    ...R("routes/api-utenti.cjs"),
    ...R("routes/utenti-evento.cjs")
  },

  /* =========================================================
     ORDINI UTENTE
  ========================================================== */
  ordini: {
    ...R("routes/ordini-utente.cjs")
  },

  /* =========================================================
     PAYPAL
  ========================================================== */
  paypal: {
    ...R("routes/paypal-create.cjs"),
    ...R("routes/paypal-complete.cjs"),
    ...R("routes/paypal-cancel.cjs"),
    ...R("routes/paypal-ricrea.cjs")
  },

  /* =========================================================
     VENDITE / DOWNLOAD
  ========================================================== */
  vendite: {
    ...R("routes/api-vendite-download.cjs")
  },

  /* =========================================================
     RIMBORSO
  ========================================================== */
  rimborso: {
    ...R("routes/rimborso.cjs")
  },

  /* =========================================================
     ADMIN
  ========================================================== */
  admin: {
    ...R("routes/api-admin.cjs"),
    ...R("routes/admin-dashboard.cjs"),
    ...R("routes/admin-feedback.cjs"),
    ...R("routes/admin-utenti.cjs")
  },

  /* =========================================================
     UPLOAD
  ========================================================== */
  upload: {
    ...R("routes/api-upload.cjs")
  },

  /* =========================================================
     ASSISTENZA
  ========================================================== */
  assistenza: {
    ...R("routes/api-assistenza.cjs")
  },

  /* =========================================================
     EVENTI UTENTE
  ========================================================== */
  eventi: {
    ...R("routes/utenti-evento.cjs")
  },

  /* =========================================================
     CHAT / VOICE / ATTACHMENT
  ========================================================== */
  chat: {
    ...R("routes/chat.cjs"),
    ...R("routes/chat-voice.cjs"),
    ...R("routes/chat-attachment.cjs")
  },

  /* =========================================================
     NEWSLETTER
  ========================================================== */
  newsletter: {
    ...R("routes/newsletter.cjs")
  },

  /* =========================================================
     DIAGNOSTICA FETCH (frontend)
  ========================================================== */
  diagnostica: {
    ...R("routes/diagnostica-fetch.cjs")
  },

  /* =========================================================
     GENERICO JSON (universal-json)
  ========================================================== */
  generico: {
    ...R("routes/generico.cjs")
  },

  /* =========================================================
     JS-LIST (filesystem → DB → JSON)
     Compatibile con loader universale 2038
  ========================================================== */
  jslist: {
    ...R("routes/jslist.cjs")
  }

};
