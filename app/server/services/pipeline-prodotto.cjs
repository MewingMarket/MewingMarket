/* =========================================================
   FILE: app/server/services/pipeline-prodotto.cjs
   DESCRIZIONE:
   Pipeline prodotto — SOLO PUBLER
========================================================= */

const { publishProductToSocial } = R("server/services/social-post-product.cjs");

async function pipelineProdotto(product) {
  if (process.env.PIPELINE_SOCIAL_ENABLED !== "true") {
    console.log("⚠️ Pipeline social disattivata");
    return;
  }

  if (!process.env.PUBLER_API_KEY) {
    console.log("⚠️ Pipeline social: Publer non configurato");
    return;
  }

  console.log("🚀 Pipeline prodotto avviata:", product.id);

  const res = await publishProductToSocial(product);

  console.log("📤 Risultato Publer:", res);
}

module.exports = { pipelineProdotto };
