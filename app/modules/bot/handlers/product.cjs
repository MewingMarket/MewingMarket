/**
 * modules/bot/handlers/product.cjs
 * Gestione prodotti: dettagli, prezzo, video, obiezioni, acquisto, allegati
 */

const callGPT = require("../gpt.cjs");
const { reply, log } = require("../utils.cjs");
const Memory = require("../../memory.cjs");
const Context = require("../../context.cjs");

// Import MODEL catalogo
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
   HANDLER RISPOSTA BREVE PRODOTTO
   ============================================================ */
async function handleProductBasic(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = productReply(product);

  const enriched = await callGPT(
    rawText || "Mostra prodotto",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più chiaro e utile.",
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER DETTAGLI PRODOTTO
   ============================================================ */
async function handleProductDetails(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = productLongReply(product);

  const enriched = await callGPT(
    rawText || "Dettagli prodotto",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più approfondito.",
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER PREZZO PRODOTTO
   ============================================================ */
async function handleProductPrice(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const base = `
💰 <b>Prezzo:</b> ${product.prezzo}€
👉 <b>Acquista ora:</b>  
${product.linkPayhip}

Vuoi vedere i dettagli completi?
`;

  const enriched = await callGPT(
    rawText || "Prezzo prodotto",
    Memory.get(uid),
    pageContext,
    "\nAggiungi una frase che inviti a chiedere altro.",
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER VIDEO PRODOTTO
   ============================================================ */
async function handleProductVideo(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const video = product.youtube_url || product.catalog_video_block;

  const base = video
    ? `
🎥 <b>Video del prodotto</b>  
${video}

Vuoi altre informazioni?
`
    : "Questo prodotto non ha un video disponibile.";

  const enriched = await callGPT(
    rawText || "Video prodotto",
    Memory.get(uid),
    pageContext,
    "\nRendi il messaggio più utile.",
    { product }
  );

  return reply(res, enriched || base);
}

/* ============================================================
   HANDLER OBIEZIONE
   ============================================================ */
async function handleObjection(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const enriched = await callGPT(
    rawText || "Obiezione prodotto",
    Memory.get(uid),
    pageContext,
    "\nRispondi all'obiezione in modo professionale.",
    { product }
  );

  return reply(res, enriched);
}

/* ============================================================
   HANDLER TRATTATIVA
   ============================================================ */
async function handleNegotiation(req, res, product, rawText) {
  const uid = req?.uid || "unknown_user";
  const pageContext = Context.get(req) || {};

  const enriched = await callGPT(
    rawText || "Trattativa prezzo",
    Memory.get(uid),
    pageContext,
    "\nRispondi in modo elegante senza offrire sconti.",
    { product }
  );

  return reply(res, enriched);
}

/* ============================================================
   HANDLER ACQUISTO DIRETTO
   ============================================================ */
async function handleDirectPurchase(req, res, product) {
  const base = `
Perfetto 😎  
👉 Puoi acquistarlo qui:  
${product.linkPayhip}

Vuoi vedere anche i dettagli?
`;

  return reply(res, base);
}

/* ============================================================
   HANDLER ALLEGATO
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
    return reply(res, "Non ho trovato questo prodotto. Vuoi vedere il catalogo?");
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
