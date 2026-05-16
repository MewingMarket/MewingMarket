/**
 * FILE: lim-social-renderer.cjs
 * PATH: /app/modules/social/lim-social-renderer.cjs
 * DESC: Renderer LIM per post social (Influencer Bot)
 */

module.exports = function renderSocialPost(post) {
  if (!post) {
    return {
      type: "mission",
      avatar: "influencer",
      blocks: [
        { title: "Nessun contenuto", text: "Non ho trovato post da mostrarti." }
      ]
    };
  }

  return {
    type: "mission",
    avatar: "influencer",
    blocks: [
      {
        title: `Post su ${post.piattaforma}`,
        text: post.testo || "Contenuto non disponibile."
      },
      {
        title: "Apri il post",
        cta: {
          label: "Vai al post",
          href: post.link
        }
      }
    ]
  };
};
