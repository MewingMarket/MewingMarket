/**
 * FILE: app/server/routes/catalogo-personalizzato.cjs
 * VERSIONE: 2057 — COMPLETAMENTE ASINCRONA E NON BLOCCANTE
 * DESCRIZIONE: Catalogo personalizzato con promozioni (senza blocchi)
 */

const path = require("path");
const promoService = require(path.join(process.cwd(), "app/modules/promo/promoService.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

/* ============================================================
   ENDPOINT: GET /api/catalogo/personalizzato
   VERSIONE 2057 — FIXATA
============================================================ */
async function getCatalogoPersonalizzato(req) {
  console.log("[CATALOGO PERSONALIZZATO] getCatalogoPersonalizzato()");

  try {
    const userId = req.user?.id;

    // ============================================================
    // 1) CARICA PRODOTTI UNA SOLA VOLTA (asincrono)
    // ============================================================
    const prodotti = await catalogo.getAllProducts();

    // ============================================================
    // 2) UTENTE NON LOGGATO → catalogo normale
    // ============================================================
    if (!userId) {
      return { success: true, prodotti };
    }

    // ============================================================
    // 3) LEGGI PROMO ATTIVA (asincrono)
    // ============================================================
    const promo = await promoService.getPromoAttiva(userId);

    // Nessuna promo → catalogo normale
    if (!promo) {
      return { success: true, prodotti };
    }

    // ============================================================
    // 4) APPLICA SCONTI (asincrono)
    // ============================================================
    const prodottiScontati = await promoService.applicaSconti(prodotti, promo, userId);

    // ============================================================
    // 5) RISPOSTA FINALE
    // ============================================================
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
   EXPORT
============================================================ */
module.exports = {
  getCatalogoPersonalizzato
};
