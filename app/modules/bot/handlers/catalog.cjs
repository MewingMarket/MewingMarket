/**
 * modules/bot/handlers/catalog.cjs
 * Catalogo dinamico — compatibile con backend, PayPal e nuovo store
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

/* ============================================================
   HANDLER CATALOGO
============================================================ */
module.exports = async function catalogHandler(req, res, rawText, PRODUCTS) {
  log("HANDLER_CATALOG", { rawText });

  // Nessun prodotto disponibile
  if (!PRODUCTS || !PRODUCTS.length) {
    return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">Catalogo non disponibile</div>
  <div class="mm-card-body">
    Il catalogo sarà presto disponibile.  
    Stiamo aggiornando i prodotti.
  </div>
</div>
`);
  }

  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  // Aggiorna contesto
  Context.update(uid, "catalogo", null);

  /* ============================================================
     COSTRUZIONE LISTA PRODOTTI
  ============================================================ */

  let out = `
<div class="mm-card">
  <div class="mm-card-title">📚 Catalogo MewingMarket</div>
  <div class="mm-card-body">
`;

  for (const p of PRODUCTS) {
    const titolo = p.titoloBreve || p.titolo;
    const prezzo = p.prezzo ? `${p.prezzo}€` : "—";
    const slug = p.slug || "";
    const img = p.immagine || "";
    const categoria = p.categoria || "Generico";

    out += `
<div class="mm-product">
  <b>${titolo}</b><br>
  Categoria: ${categoria}<br>
  Prezzo: <b>${prezzo}</b><br>
  <a href="prodotto.html?slug=${slug}" class="mm-btn">Vedi prodotto</a>
</div>
<br>
`;
  }

  out += `
  </div>
</div>

<div class="mm-info">
Scrivi il nome di un prodotto o il tuo obiettivo.  
Posso consigliarti quello più adatto.
</div>
`;

  /* ============================================================
     GPT — arricchimento finale
  ============================================================ */

  const enriched = await callGPT(
    rawText || "Mostra catalogo",
    Memory.get(uid),
    pageContext,
    `
Aggiungi una frase finale che inviti a chiedere consiglio.
Non inventare prodotti. Non creare link Payhip.
Usa solo ciò che è già presente nel catalogo.
    `.trim(),
    { products: PRODUCTS }
  );

  return reply(res, out + (enriched || ""));
};
