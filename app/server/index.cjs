/* =========================================================
   INDEX DELLE FUNZIONI — Versione 2027.10 (patch completa)
   Tutte le API interne sono qui.
========================================================= */

const path = require("path");
const R = (p) => require(path.join(process.cwd(), "app/server", p));

module.exports = {

  /* =========================================================
     PRODOTTI
     - API principali prodotti
     - Estensioni AI prodotti
     - Top recensioni prodotto (per vetrine / homepage)
  ========================================================= */
  prodotti: {
    // API prodotti “nuove”
    ...R("routes/api-prodotti-new.cjs"),

    // Estensioni AI sui prodotti (es: generaDescrizioneAI)
    ...R("routes/prodotti-ai.cjs"),

    // Endpoint di vetrina/top prodotti legati alle recensioni
    // (es: getTopRecensioni / prodottiAcquistati, se esposti qui)
    ...R("routes/api-recensioni-top.cjs")
  },

  /* =========================================================
     UTENTI
     - login / registrazione / profilo
     - reset password / email
  ========================================================= */
  utenti: {
    ...R("routes/api-utenti.cjs")
  },

  /* =========================================================
     ORDINI
     - ordini utente
     - annulla ordine, ecc.
  ========================================================= */
  ordini: {
    ...R("routes/ordini-utente.cjs")
  },

  /* =========================================================
     PAYPAL
     - create / complete / cancel / ricrea
  ========================================================= */
  paypal: {
    ...R("routes/paypal-create.cjs"),
    ...R("routes/paypal-complete.cjs"),
    ...R("routes/paypal-cancel.cjs"),
    ...R("routes/paypal-ricrea.cjs")
  },

  /* =========================================================
     VENDITE / DOWNLOAD
     - download autenticato / diretto / per ID
  ========================================================= */
  vendite: {
    ...R("routes/api-vendite-download.cjs")
  },

  /* =========================================================
     RECENSIONI / FEEDBACK
     - crea / modifica / elimina recensione
     - liste recensioni / prodotti acquistati
     - top recensioni (se non già mappate in prodotti)
  ========================================================= */
  recensioni: {
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  },

  /* =========================================================
     RIMBORSO
     - crea / approva / rifiuta rimborso
     - richieste rimborso
  ========================================================= */
  rimborso: {
    ...R("routes/rimborso.cjs")
  },

  /* =========================================================
     ADMIN
     - API admin
     - dashboard
     - gestione utenti
     - feedback admin
  ========================================================= */
  admin: {
    ...R("routes/api-admin.cjs"),
    ...R("routes/admin-dashboard.cjs"),
    ...R("routes/admin-feedback.cjs"),
    ...R("routes/admin-utenti.cjs")
  },

  /* =========================================================
     UPLOAD
     - upload file prodotto
  ========================================================= */
  upload: {
    ...R("routes/api-upload.cjs")
  },

  /* =========================================================
     ASSISTENZA
     - invio richieste assistenza
  ========================================================= */
  assistenza: {
    ...R("routes/api-assistenza.cjs")
  },

  /* =========================================================
     EVENTI / UTENTI-EVENTO
     - tracciamento eventi utente
  ========================================================= */
  eventi: {
    ...R("routes/utenti-evento.cjs")
  }

};
