// modules/sitemap.js

const { getProducts } = require("./airtable");

function generateSitemap() {
  const base = "https://www.mewingmarket.it";

  const staticPages = [
    "",
    "/catalogo",
    "/privacy",
    "/termini"
  ];

  const products = getProducts();

  const productUrls = products.map(p => `/prodotto/${p.slug}`);

  const urls = [...staticPages, ...productUrls];

  const xml = `
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    u => `
  <url>
    <loc>${base}${u}</loc>
    <changefreq>weekly</changefreq>
  </url>`
  )
  .join("")}
</urlset>
`.trim();

  return xml;
}

module.exports = {
  generateSitemap
};
