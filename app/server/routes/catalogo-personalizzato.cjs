/**
 * FILE: app/server/routes/catalogo-personalizzato.cjs
 * VERSIONE: 2027.3 — PATCH STABILE
 * DESCRIZIONE: Catalogo personalizzato con promozioni
 * COMPATIBILE con Java‑mode e catalogo SQL SINCRONO
 */

const path = require("path");
const ROOT = process.cwd();

const promoService = require(path.join(ROOT, "app/modules/promo/promoService.cjs"));
const catalogo = require(path.join(ROOT, "app/modules/catalogo-sql.cjs"));

/* ============================================================
   ENDPOINT: /api/catalogo/personalizzato
============================================================ */
async function getCatalogoPersonalizzato(req) {
  console.log("[CATALOGO PERSONALIZZATO] getCatalogoPersonalizzato()");

  try {
    const userId = req.user?.id || null;

    /* ---------------------------------------------------------
       1) CARICA PRODOTTI (SINCRONO)
    --------------------------------------------------------- */
    let prodotti = [];
    try {
      prodotti = catalogo.getAllProducts(); // SINCRONO
    } catch (err) {
      console.error("❌ ERRORE catalogo.getAllProducts:", err);
      return { success: false, error: "Errore caricamento catalogo" };
    }

    /* ---------------------------------------------------------
       2) UTENTE NON LOGGATO → catalogo normale
    --------------------------------------------------------- */
    if (!userId) {
      return { success: true, prodotti };
    }

    /* ---------------------------------------------------------
       3) LEGGI PROMO ATTIVA (SINCRONO)
    --------------------------------------------------------- */
    let promo = null;
    try {
      promo = promoService.getPromoAttiva(userId); // SINCRONO
    } catch (err) {
      console.error("⚠️ ERRORE getPromoAttiva:", err);
      promo = null;
    }

    if (!promo) {
      return { success: true, prodotti };
    }

    /* ---------------------------------------------------------
       4) APPLICA SCONTI (SINCRONO)
    --------------------------------------------------------- */
    let prodottiScontati = [];
    try {
      prodottiScontati = promoService.applicaSconti(prodotti, promo, userId); // SINCRONO
    } catch (err) {
      console.error("⚠️ ERRORE applicaSconti:", err);
      return { success: true, prodotti }; // fallback sicuro
    }

    /* ---------------------------------------------------------
       5) RISPOSTA FINALE
    --------------------------------------------------------- */
    return {
      success: true,
      prodotti: prodottiScontati
    };

  } catch (err) {
    console.error("❌ ERRORE getCatalogoPersonalizzato:", err);
    return { success: false, error: "Errore catalogo personalizzato" };
  }
}

/* ============================================================
   ALIAS COMPATIBILITÀ FRONTEND
============================================================ */
async function getCatalogo(req) {
  console.log("[CATALOGO PERSONALIZZATO] alias getCatalogo() → getCatalogoPersonalizzato()");
  return getCatalogoPersonalizzato(req);
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  getCatalogoPersonalizzato,
  getCatalogo // alias
};
