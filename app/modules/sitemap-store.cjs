// modules/sitemap-store.cjs — VERSIONE CORRETTA

const path = require("path");
const { getProducts } = require(path.join(__dirname, "airtable.cjs"));

function generateStoreSitemap() {
  const products = getProducts();

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  products.forEach(p => {
    if (!p.linkPayhip) return;

    xml += `
  <url>
    <loc>${p.linkPayhip}</loc>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  });

  xml += `\n</urlset>`;
  return xml;
}

module.exports = { generateStoreSitemap };
