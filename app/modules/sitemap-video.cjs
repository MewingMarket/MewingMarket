// modules/sitemap-video.cjs — VERSIONE AVANZATA

const { getProducts } = require("./airtable.cjs");
const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP VIDEO AVANZATA (Google Video)
========================================================= */
function generateVideoSitemap() {
  try {
    const products = Array.isArray(getProducts()) ? getProducts() : [];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                   xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">\n`;

    products.forEach(p => {
      const videoUrl = cleanURL(p?.youtube_last_video_url || p?.youtube_url);
      const thumb = cleanURL(p?.youtube_thumbnail);
      const title = safeText(p?.youtube_title || p?.titolo || "");
      const desc = safeText(p?.youtube_description || p?.descrizioneBreve || "");

      if (!videoUrl) return;

      xml += `
  <url>
    <loc>${videoUrl}</loc>
    <video:video>
      <video:content_loc>${videoUrl}</video:content_loc>
      <video:player_loc>${videoUrl}</video:player_loc>
      <video:title><![CDATA[${title}]]></video:title>
      <video:description><![CDATA[${desc}]]></video:description>
      ${thumb ? `<video:thumbnail_loc>${thumb}</video:thumbnail_loc>` : ""}
      <video:family_friendly>yes</video:family_friendly>
    </video:video>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateVideoSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateVideoSitemap };
