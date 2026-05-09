/* =========================================================
   FILE: app/server/services/social-post-product.cjs
   DESCRIZIONE:
   Genera caption + pubblica immagine prodotto via Publer
========================================================= */

const { publerPost } = R("server/services/publer-api.cjs");

async function publishProductToSocial(product) {
  const profiles = [
    process.env.PUBLER_INSTAGRAM,
    process.env.PUBLER_FACEBOOK,
    process.env.PUBLER_LINKEDIN,
    process.env.PUBLER_YT_COMMUNITY
  ];

  const caption = `🔥 ${product.nome}\n\n${product.descrizione}\n\n#${product.categoria}`;

  return await publerPost({
    text: caption,
    imageUrl: product.immagine,
    profiles
  });
}

module.exports = { publishProductToSocial };
