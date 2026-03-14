/**
 * =========================================================
 * File: app/modules/sitemap-images-advanced.cjs
 * Google Image Sitemap avanzata basata su tabella prodotti (SQL)
 * =========================================================
 */

const db = require("../db/database.cjs");

function escapeCDATA(str) {
  if (!str) return "";
  return str.replace(/]]>/g, "]]]]><![CDATA[>");
}

function generateAdvancedImagesSitemap() {
  try {
    const stmt = db.prepare(`
      SELECT 
        slug,
        titolo_breve,
        descrizione_breve,
        descrizione_lunga,
        immagine_url,
        youtube_thumbnail,
        youtube_title
      FROM prodotti
      ORDER BY id DESC
    `);

    const rows = stmt.all();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
                   xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n`;

    rows.forEach(p => {
      const productUrl = `https://mewingmarket.com/prodotto/${p.slug}`;

      xml += `
  <url>
    <loc>${productUrl}</loc>
`;

      // Immagine principale del prodotto
      if (p.immagine_url) {
        xml += `
    <image:image>
      <image:loc>${p.immagine_url}</image:loc>
      <image:title><![CDATA[${escapeCDATA(p.titolo_breve || "")}]]></image:title>
      <image:caption><![CDATA[${escapeCDATA(p.descrizione_breve || p.descrizione_lunga || "")}]]></image:caption>
    </image:image>`;
      }

      // Thumbnail YouTube
      if (p.youtube_thumbnail) {
        xml += `
    <image:image>
      <image:loc>${p.youtube_thumbnail}</image:loc>
      <image:title><![CDATA[${escapeCDATA(p.youtube_title || p.titolo_breve || "")}]]></image:title>
      <image:caption><![CDATA[${escapeCDATA(p.descrizione_breve || p.descrizione_lunga || "")}]]></image:caption>
    </image:image>`;
      }

      xml += `
  </url>`;
    });

    xml += `\n</urlset>`;
    return xml;

  } catch (err) {
    console.error("❌ Errore generateAdvancedImagesSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateAdvancedImagesSitemap };
