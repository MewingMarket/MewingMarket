/**
 * modules/bot/handlers/product.cjs
 * Gestione prodotti: dettagli, prezzo, video, obiezioni, acquisto, allegati
 */

const callGPT = require("../gpt.cjs");
const { reply } = require("../utils.cjs");
const log = global.logBot || console.log;

const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

// MODEL catalogo aggiornato
const {
  findProductBySlug,
  findProductFromText,
  productReply,
  productLongReply,
  productImageReply
} = require("../../catalogo.cjs");

/* ============================================================
   TROVA PRODOTTO DA INTENT
============================================================ */
function resolveProduct(intent, sub, rawText, PRODUCTS) {
  if (intent === "prodotto" && sub) {
    return findProductBySlug(sub);
  }
  return findProductFromText(rawText);
}

/* ============================================================
   RISPOSTA BREVE PRODOTTO
============================================================ */
async function handleProductBasic(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const base = productReply(product);

  const enriched = await callGPT(
    rawText || "Mostra prodotto",
    Memory.get(uid),
    pageContext,
    `
Rendi il messaggio più chiaro e utile.
Non inventare informazioni. Non creare link Payhip.
Se suggerisci un link, usa solo: prodotto.html?slug=${product.slug}
    `.trim(),
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   DETTAGLI PRODOTTO
============================================================ */
async function handleProductDetails(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const base = productLongReply(product);

  const enriched = await callGPT(
    rawText || "Dettagli prodotto",
    Memory.get(uid),
    pageContext,
    `
Rendi il messaggio più approfondito.
Non inventare caratteristiche non presenti nel catalogo.
    `.trim(),
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   PREZZO PRODOTTO
============================================================ */
async function handleProductPrice(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">💰 Prezzo</div>
  <div class="mm-card-body">
    <b>${product.prezzo}€</b><br><br>
    <a href="prodotto.html?slug=${product.slug}" class="mm-btn">Vedi prodotto</a>
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Prezzo prodotto",
    Memory.get(uid),
    pageContext,
    `
Aggiungi una frase che inviti a chiedere altro.
Non inventare link o prezzi.
    `.trim(),
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   VIDEO PRODOTTO
============================================================ */
async function handleProductVideo(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const video = product.youtube_url || product.catalog_video_block;

  const base = video
    ? `
<div class="mm-card">
  <div class="mm-card-title">🎥 Video del prodotto</div>
  <div class="mm-card-body">
    ${video}<br><br>
    Vuoi altre informazioni?
  </div>
</div>
`
    : `
<div class="mm-card">
  <div class="mm-card-body">
    Questo prodotto non ha un video disponibile.
  </div>
</div>
`;

  const enriched = await callGPT(
    rawText || "Video prodotto",
    Memory.get(uid),
    pageContext,
    `
Rendi il messaggio più utile.
Non inventare video o link.
    `.trim(),
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   OBIEZIONE
============================================================ */
async function handleObjection(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const enriched = await callGPT(
    rawText || "Obiezione prodotto",
    Memory.get(uid),
    pageContext,
    `
Rispondi all'obiezione in modo professionale.
Non offrire sconti. Non inventare caratteristiche.
    `.trim(),
    { product }
  );

  return reply(res, enriched);
}

/* ============================================================
   TRATTATIVA
============================================================ */
async function handleNegotiation(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(uid) || {};

  Context.update(uid, "prodotto", product.slug);

  const enriched = await callGPT(
    rawText || "Trattativa prezzo",
    Memory.get(uid),
    pageContext,
    `
Rispondi in modo elegante senza offrire sconti.
Non inventare promozioni.
    `.trim(),
    { product }
  );

  return reply(res, enriched);
}

/* ============================================================
   ACQUISTO DIRETTO
============================================================ */
async function handleDirectPurchase(req, res, product) {
  Context.update(req.uid || "unknown_user", "prodotto", product.slug);

  const base = `
<div class="mm-card">
  <div class="mm-card-title">Acquisto</div>
  <div class="mm-card-body">
    Perfetto 😎<br><br>
    👉 Puoi acquistarlo qui:<br>
    <a href="prodotto.html?slug=${product.slug}" class="mm-btn">Vai al prodotto</a><br><br>
    Vuoi vedere anche i dettagli?
  </div>
</div>
`;

  return reply(res, base);
}

/* ============================================================
   ALLEGATO
============================================================ */
async function handleAttachment(req, res, fileName) {
  return reply(res, `Hai inviato un file: <b>${fileName}</b>`);
}

/* ============================================================
   ROUTER INTERNO
============================================================ */
module.exports = async function productHandler(req, res, intent, sub, rawText, PRODUCTS) {
  log("HANDLER_PRODUCT", { intent, sub, rawText });

  const product = resolveProduct(intent, sub, rawText, PRODUCTS);

  if (!product) {
    return reply(res, `
<div class="mm-card">
  <div class="mm-card-body">
    Non ho trovato questo prodotto.<br>
    Vuoi vedere il catalogo?
  </div>
</div>
`);
  }

  switch (intent) {
    case "prodotto":
      return handleProductBasic(req, res, product, rawText);

    case "dettagli_prodotto":
      return handleProductDetails(req, res, product, rawText);

    case "prezzo_prodotto":
      return handleProductPrice(req, res, product, rawText);

    case "video_prodotto":
      return handleProductVideo(req, res, product, rawText);

    case "obiezione":
      return handleObjection(req, res, product, rawText);

    case "trattativa":
      return handleNegotiation(req, res, product, rawText);

    case "acquisto_diretto":
      return handleDirectPurchase(req, res, product);

    case "allegato":
      return handleAttachment(req, res, sub);

    default:
      return reply(res, "Vuoi informazioni su un prodotto?");
  }
};
