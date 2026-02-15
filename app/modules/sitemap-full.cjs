// modules/sitemap-full.cjs — VERSIONE BLINDATA

const { generateSitemap } = require("./sitemap.cjs");
const { generateFooterSitemap } = require("./sitemap-footer.cjs");
const { generateImagesSitemap } = require("./sitemap-images.cjs");
const { generateSocialSitemap } = require("./sitemap-social.cjs");
const { generateStoreSitemap } = require("./sitemap-store.cjs");
const { generateYouTubeSitemap } = require("./sitemap-youtube.cjs");

/* =========================================================
   GENERA SITEMAP COMPLETA (blindata)
========================================================= */
function generateFullSitemap() {
  try {
    const parts = [
      generateSitemap(),
      generateFooterSitemap(),
      generateImagesSitemap(),
      generateSocialSitemap(),
      generateStoreSitemap(),
      generateYouTubeSitemap()
    ];

    const xml = `
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
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
