/**
 * modules/bot/handlers/fallback.cjs
 * Fallback intelligente: FAQ, Guide, Catalogo, Supporto, GPT
 */

const path = require("path");

// PATCH: require assoluti
const callGPT = require(path.join(process.cwd(), "app/modules/bot/gpt.cjs"));
const { reply, log } = require(path.join(process.cwd(), "app/modules/bot/utils.cjs"));
const Memory = require(path.join(process.cwd(), "app/modules/memory.cjs"));

// 🔥 PATCH: percorso corretto
const Context = require(path.join(process.cwd(), "app/modules/bot/context.cjs"));

// Moduli dinamici
const FAQ = require(path.join(process.cwd(), "app/modules/faq.cjs"));
const Guides = require(path.join(process.cwd(), "app/modules/guides.cjs"));
const { fuzzyMatchProduct } = require(path.join(process.cwd(), "app/modules/catalogo.cjs"));

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
     🔥 PATCH: rimozione slug, uso ID + link corretto
  ============================================================ */
  const product = fuzzyMatchProduct(text);
  if (product) {
    log("FALLBACK_PRODUCT_MATCH", product.id);

    const id = String(product.id || "");

    return reply(res, `
<div class="mm-card">
  <div class="mm-card-title">${product.titolo}</div>
  <div class="mm-card-body">
    Prezzo: <b>${product.prezzo}€</b><br>
    Categoria: ${product.categoria}<br><br>
    <a href="https://www.mewingmarket.it/prodotto/${id}" class="mm-btn">Vedi prodotto</a>
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
