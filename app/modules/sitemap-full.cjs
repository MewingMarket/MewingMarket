// app/modules/sitemap-full.cjs — VERSIONE DEFINITIVA, BLINDATA

const path = require("path");

// PATCH: require assoluti
const { generateSitemap } = require(path.join(process.cwd(), "app/modules/sitemap.cjs"));
const { generateFooterSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-footer.cjs"));
const { generateImagesSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-images.cjs"));
const { generateAdvancedImagesSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-images-advanced.cjs"));
const { generateSocialSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-social.cjs"));
const { generateStoreSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-store.cjs"));
const { generateYouTubeSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-youtube.cjs"));
const { generateVideoSitemap } = require(path.join(process.cwd(), "app/modules/sitemap-video.cjs"));

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
