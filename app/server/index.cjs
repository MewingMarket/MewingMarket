/* =========================================================
   INDEX DELLE FUNZIONI — Versione 2027.30 (patch completa)
   Compatibile con:
   - router universale 2027.901
   - universal-json
   - diagnostica
   - generico-json
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

module.exports = {

  /* =========================================================
     PRODOTTI / CATALOGO / RECENSIONI PUBBLICHE
  ========================================================== */
  prodotti: {
    ...R("routes/api-prodotti-new.cjs"),
    ...R("routes/prodotti-ai.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  /* =========================================================
     UTENTI (login, registrazione, profilo, eventi)
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
     RECENSIONI / FEEDBACK
  ========================================================== */
  recensioni: {
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
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
  }
};
