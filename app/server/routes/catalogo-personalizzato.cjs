/**
 * FILE: app/server/routes/catalogo-personalizzato.cjs
 * DESCRIZIONE: Catalogo personalizzato con promozioni
 */

const path = require("path");
const promoService = require(path.join(process.cwd(), "app/modules/promo/promoService.cjs"));
const catalogo = require(path.join(process.cwd(), "app/modules/catalogo-sql.cjs"));

/* ============================================================
   ENDPOINT: GET /api/catalogo/personalizzato
============================================================ */
async function getCatalogoPersonalizzato(req) {
  console.log("[CATALOGO PERSONALIZZATO] getCatalogoPersonalizzato()");

  try {
    const userId = req.user?.id;

    // Se non loggato → catalogo normale
    if (!userId) {
      const prodotti = catalogo.getAllProducts();
      return { success: true, prodotti };
    }

    // 1) Leggi promozione attiva
    const promo = promoService.getPromoAttiva(userId);

    // Nessuna promo → catalogo normale
    if (!promo) {
      const prodotti = catalogo.getAllProducts();
      return { success: true, prodotti };
    }

    // 2) Applica sconti
    const prodotti = catalogo.getAllProducts();
    const prodottiScontati = promoService.applicaSconti(prodotti, promo, userId);

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
