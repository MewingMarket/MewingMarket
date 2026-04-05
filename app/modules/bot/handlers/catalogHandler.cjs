/**
 * modules/bot/handlers/catalogHandler.cjs — VERSIONE DEFINITIVA PATCHATA
 * Risposta catalogo dinamico per bot MewingMarket
 */

const path = require("path");
const { listAllProducts } = require(path.join(__dirname, "..", "catalogo.cjs"));
const { updateContext } = require(path.join(__dirname, "..", "context.cjs"));

/* ============================================================
   RISPOSTA CATALOGO
============================================================ */
async function catalogHandler(ctx) {
  const products = await listAllProducts();

  if (!products.length) {
    return "Il catalogo è temporaneamente non disponibile.";
  }

  // Aggiorna contesto
  updateContext(ctx, { intent: "catalogo" });

  // Risposta premium
  let out = "📚 <b>Catalogo MewingMarket</b>\n\n";

  for (const p of products) {
    const prezzo = (p.prezzo_cent / 100).toFixed(2);

    out += `
<b>${p.titolo_breve}</b>
${p.descrizione_breve}
💰 <b>${prezzo}€</b>
👉 https://www.mewingmarket.it/prodotto/${p.id}

`;
  }

  return out.trim();
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = catalogHandler;
