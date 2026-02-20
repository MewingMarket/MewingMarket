// =========================================================
// File: app/modules/sitemap-store.cjs
// Sitemap footer dinamica — legge direttamente footer.html
// =========================================================

const fs = require("fs");
const path = require("path");
const { cleanURL, safeText } = require("./utils.cjs");

function generateFooterSitemap() {
  try {
    const footerPath = path.join(__dirname, "..", "public", "footer.html");

    if (!fs.existsSync(footerPath)) {
      console.error("❌ footer.html non trovato");
      return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
    }

    const html = fs.readFileSync(footerPath, "utf8");

    // Estrae tutti i link <a href="...">
    const links = [...html.matchAll(/<a[^>]+href="([^"]+)"/g)]
      .map(m => m[1])
      .filter(href =>
        href &&
        !href.startsWith("#") &&
        !href.startsWith("http") &&
        href.endsWith(".html")
      );

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    links.forEach(file => {
      const safeFile = safeText(file);
      const url = cleanURL(`https://www.mewingmarket.it/${safeFile}`);

      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      xml += `    <changefreq>monthly</changefreq>\n`;
      xml += `    <priority>0.6</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;

  } catch (err) {
    console.error("❌ Errore generateFooterSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateFooterSitemap };
