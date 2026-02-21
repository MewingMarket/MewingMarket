/**
 * modules/bot/handlers/fallback.cjs
 * Fallback intelligente: FAQ, Guide, Catalogo, Supporto, GPT
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

// Moduli dinamici
const FAQ = require("../../faq.cjs");
const Guides = require("../../guides.cjs");
const { fuzzyMatchProduct } = require("../../catalogo.cjs");

module.exports = async function fallbackHandler(req, res, rawText) {
  log("HANDLER_FALLBACK", { rawText });

  const uid = req?.uid || "unknown_user";

  // Aggiorna contesto
  Context.update(uid, "fallback", null);

  const memory = Memory.get(uid) || [];
  const pageContext = Context.get(uid) || {};

  const text = rawText?.toLowerCase() || "";

  /* ============================================================
     1) MATCH FAQ
  ============================================================ */
  const faqMatch = FAQ.search(text);
  if (faqMatch) {
    log("FALLBACK_FAQ_MATCH", faqMatch);
    return reply(res, FAQ.render(faqMatch));
  }

  /* ============================================================
     2) MATCH GUIDE
  ============================================================ */
  const guideMatch = Guides.search(text);
  if (guideMatch) {
    log("FALLBACK_GUIDE_MATCH", guideMatch);
    return reply(res, Guides.render(guideMatch));
  }

  /* ============================================================
     3) MATCH PRODOTTO
  ============================================================ */
  const product = fuzzyMatchProduct(text);
  if (product) {
    log("FALLBACK_PRODUCT_MATCH", product.slug);

    return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">${product.titolo}</div>
  <div class="mm-card-body">
    Prezzo: <b>${product.prezzo}€</b><br>
    Categoria: ${product.categoria}<br><br>
    <a href="prodotto.html?slug=${product.slug}" class="mm-btn">Vedi prodotto</a>
  </div>
</div>
`);
  }

  /* ============================================================
     4) SUGGERIMENTI AUTOMATICI
  ============================================================ */
  const suggestions = `
<div class="mm-card">
  <div class="mm-card-title">Posso aiutarti con:</div>
  <div class="mm-card-body">
    • <b>Catalogo</b><br>
    • <b>Login / Registrazione</b><br>
    • <b>Download prodotti</b><br>
    • <b>Ordini e rimborsi</b><br>
    • <b>Guide e FAQ</b><br><br>
    Se vuoi, posso anche rispondere in modo naturale.
  </div>
</div>
`;

  /* ============================================================
     5) GPT COME ULTIMO STEP
  ============================================================ */
  let systemPrompt = `
Rispondi in modo naturale, utile e amichevole.
Se possibile, proponi una delle seguenti opzioni:
- vedere il catalogo
- leggere una guida
- consultare le FAQ
- chiedere supporto
- tornare al menu
`;

  if (memory.length > 0) {
    systemPrompt += `\nMemoria conversazione: ${JSON.stringify(memory)}\n`;
  }

  if (pageContext && Object.keys(pageContext).length > 0) {
    systemPrompt += `\nContesto pagina: ${JSON.stringify(pageContext)}\n`;
  }

  const enriched = await callGPT(
    rawText || "Fallback",
    memory,
    pageContext,
    systemPrompt.trim(),
    {}
  );

  return reply(res, enriched || suggestions);
};
