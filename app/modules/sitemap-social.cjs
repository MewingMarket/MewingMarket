// modules/sitemap-social.js — VERSIONE BLINDATA

const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP SOCIAL (blindata)
========================================================= */
function generateSocialSitemap() {
  try {
    const socials = [
      "https://www.instagram.com/mewingmarket",
      "https://www.tiktok.com/@mewingmarket",
      "https://www.youtube.com/@mewingmarket2",
      "https://www.facebook.com/profile.php?id=61584779793628",
      "https://x.com/mewingm8",
      "https://www.threads.net/@mewingmarket",
      "https://www.linkedin.com/company/mewingmarket",
      "https://wa.me/393520266660"
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    socials.forEach(rawUrl => {
      const url = cleanURL(rawUrl);
      if (!url) return; // evita URL rotti

      xml += `
  <url>
    <loc>${url}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.3</priority>
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateSocialSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateSocialSitemap };
