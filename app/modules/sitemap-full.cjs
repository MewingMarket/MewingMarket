// app/modules/sitemap-full.cjs — VERSIONE DEFINITIVA, BLINDATA

const { generateSitemap } = require("./sitemap.cjs");
const { generateFooterSitemap } = require("./sitemap-footer.cjs");
const { generateImagesSitemap } = require("./sitemap-images.cjs");
const { generateAdvancedImagesSitemap } = require("./sitemap-images-advanced.cjs");
const { generateSocialSitemap } = require("./sitemap-social.cjs");
const { generateStoreSitemap } = require("./sitemap-store.cjs");
const { generateYouTubeSitemap } = require("./sitemap-youtube.cjs");
const { generateVideoSitemap } = require("./sitemap-video.cjs");

/* =========================================================
   GENERA SITEMAP COMPLETA (blindata)
========================================================= */
function generateFullSitemap() {
  try {
    const parts = [
      generateSitemap(),                 // pagine statiche + prodotti
      generateFooterSitemap(),           // footer
      generateImagesSitemap(),           // immagini base
      generateAdvancedImagesSitemap(),   // immagini avanzate
      generateSocialSitemap(),           // social
      generateStoreSitemap(),            // link Payhip
      generateYouTubeSitemap(),          // video base
      generateVideoSitemap()             // video avanzata
    ];

    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${parts
  .map(p => {
    if (!p || typeof p !== "string") return "";
    return p
      .replace(/<\?xml[^>]*>/g, "")
      .replace(/<\/?urlset[^>]*>/g, "");
  })
  .join("\n")}
</urlset>
`.trim();

    return xml;

  } catch (err) {
    console.error("Errore generateFullSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateFullSitemap };
