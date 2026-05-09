/* =========================================================
   FILE: app/server/services/social-post-product.cjs
   DESCRIZIONE:
   Genera il post + pubblica immagine prodotto via Publer
========================================================= */

const { publerPost } = R("server/services/publer-api.cjs");
const { generatePostTemplate } = R("server/services/post-template-generator.cjs");

async function publishProductToSocial(product) {
  const profiles = [
    process.env.PUBLER_INSTAGRAM,
    process.env.PUBLER_FACEBOOK,
    process.env.PUBLER_LINKEDIN,
    process.env.PUBLER_YT_COMMUNITY
  ];

  // 1️⃣ Genera il post (AI o fallback)
  const post = await generatePostTemplate(product);

  // 2️⃣ Pubblica su Publer
  return await publerPost({
    text: post.fullPost,
    imageUrl: product.immagine,
    profiles
  });
}

module.exports = { publishProductToSocial };
