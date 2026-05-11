/* =========================================================
   INDEX.CJS — HARDENED MODE 2051 (AGGRESSIVE)
   Protezione totale per TUTTI i moduli e funzioni
========================================================= */

const path = require("path");
const fs = require("fs");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

/* =========================================================
   CONFIG SICUREZZA
========================================================= */

const NAME_REGEX = /^[a-z0-9_-]{1,40}$/i;

function sanitizeModule(name, mod) {
  if (!mod || typeof mod !== "object") {
    console.warn("🛑 MODULO CORROTTO:", name);
    return {};
  }

  const clean = {};
  for (const key of Object.keys(mod)) {
    if (!NAME_REGEX.test(key)) {
      console.warn(`⚠️ FUNZIONE INVALIDA (${name}):`, key);
      continue;
    }
    if (typeof mod[key] !== "function") {
      console.warn(`⚠️ FUNZIONE NON CALLABLE (${name}):`, key);
      continue;
    }
    clean[key] = mod[key];
  }

  if (Object.keys(clean).length === 0) {
    console.warn("🛑 MODULO VUOTO DOPO SANITIZZAZIONE:", name);
  }

  return clean;
}

function loadSafeModule(name, loader) {
  try {
    const raw = loader();
    return sanitizeModule(name, raw);
  } catch (e) {
    console.error(`❌ ERRORE CARICAMENTO MODULO (${name}):`, e.message);
    return {};
  }
}

/* =========================================================
   MAPPA MODULI (CON SANITIZZAZIONE)
========================================================= */

module.exports = {

  /* =========================================================
     PRODOTTI / CATALOGO
  ========================================================== */
  prodotti: loadSafeModule("prodotti", () => ({
    ...R("routes/api-prodotti-new.cjs"),
    ...R("routes/prodotti-ai.cjs")
  })),

  /* =========================================================
     AI — NUOVO MOTORE PRODOTTI
  ========================================================== */
  ai: loadSafeModule("ai", () => ({
    ...R("routes/api-prodotti-ai.cjs")
  })),

  /* =========================================================
     RECENSIONI / FEEDBACK PUBBLICI
  ========================================================== */
  recensioni: loadSafeModule("recensioni", () => ({
    ...R("routes/api-feedback.cjs"),
    ...R("routes/api-recensioni-top.cjs")
  })),

  /* =========================================================
     UTENTI
  ========================================================== */
  utenti: loadSafeModule("utenti", () => ({
    ...R("routes/api-utenti.cjs"),
    ...R("routes/utenti-evento.cjs")
  })),

  /* =========================================================
     ORDINI UTENTE
  ========================================================== */
  ordini: loadSafeModule("ordini", () => ({
    ...R("routes/ordini-utente.cjs")
  })),

  /* =========================================================
     PAYPAL
  ========================================================== */
  paypal: loadSafeModule("paypal", () => ({
    ...R("routes/paypal-create.cjs"),
    ...R("routes/paypal-complete.cjs"),
    ...R("routes/paypal-cancel.cjs"),
    ...R("routes/paypal-ricrea.cjs")
  })),

  /* =========================================================
     VENDITE / DOWNLOAD
  ========================================================== */
  vendite: loadSafeModule("vendite", () => ({
    ...R("routes/api-vendite-download.cjs")
  })),

  /* =========================================================
     RIMBORSO
  ========================================================== */
  rimborso: loadSafeModule("rimborso", () => ({
    ...R("routes/rimborso.cjs")
  })),

  /* =========================================================
     ADMIN
  ========================================================== */
  admin: loadSafeModule("admin", () => ({
    ...R("routes/api-admin.cjs"),
    ...R("routes/admin-dashboard.cjs"),
    ...R("routes/admin-feedback.cjs"),
    ...R("routes/admin-utenti.cjs"),
    ...R("routes/admin-prodotti-ai.cjs")
  })),

  /* =========================================================
     UPLOAD
  ========================================================== */
  upload: loadSafeModule("upload", () => ({
    ...R("routes/api-upload.cjs")
  })),

  /* =========================================================
     ASSISTENZA
  ========================================================== */
  assistenza: loadSafeModule("assistenza", () => ({
    ...R("routes/api-assistenza.cjs")
  })),

  /* =========================================================
     EVENTI UTENTE
  ========================================================== */
  eventi: loadSafeModule("eventi", () => ({
    ...R("routes/utenti-evento.cjs")
  })),

  /* =========================================================
     CHAT / VOICE / ATTACHMENT
  ========================================================== */
  chat: loadSafeModule("chat", () => ({
    ...R("routes/chat.cjs"),
    ...R("routes/chat-voice.cjs"),
    ...R("routes/chat-attachment.cjs")
  })),

  /* =========================================================
     NEWSLETTER
  ========================================================== */
  newsletter: loadSafeModule("newsletter", () => ({
    ...R("routes/newsletter.cjs")
  })),

  /* =========================================================
     DIAGNOSTICA FETCH (frontend)
  ========================================================== */
  diagnostica: loadSafeModule("diagnostica", () => ({
    ...R("routes/diagnostica-fetch.cjs")
  })),

  /* =========================================================
     GENERICO JSON (universal-json)
  ========================================================== */
  generico: loadSafeModule("generico", () => ({
    ...R("routes/generico.cjs")
  })),

  /* =========================================================
     JS-LIST (filesystem → DB → JSON)
  ========================================================== */
  jslist: loadSafeModule("jslist", () => ({
    ...R("routes/jslist.cjs")
  }))
};
