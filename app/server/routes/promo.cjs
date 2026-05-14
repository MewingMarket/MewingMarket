/**
 * FILE: app/server/routes/promo.cjs
 * DESCRIZIONE: Generazione promozioni post-missione
 */

const path = require("path");
const promoService = require(path.join(process.cwd(), "app/modules/promo/promoService.cjs"));

/* ============================================================
   ENDPOINT: POST /api/promo/genera
============================================================ */
async function generaPromozione(req) {
  console.log("[PROMO] generaPromozione()");

  try {
    const userId = req.user?.id;

    if (!userId) {
      return { success: false, error: "Utente non autenticato" };
    }

    const promo = promoService.creaPromozione(userId);

    return {
      success: true,
      promo
    };

  } catch (err) {
    console.error("❌ ERRORE generaPromozione:", err);
    return { success: false, error: "Errore generazione promozione" };
  }
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generaPromozione
};
