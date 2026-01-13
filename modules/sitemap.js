// modules/sitemap.js

<<<<<<< HEAD
const { listAllProducts } = require("./catalogo");

function generateSitemap() {
  const base = "https://www.mewingmarket.it";

  const staticPages = [
    "",
    "/catalogo",
    "/privacy",
    "/termini"
  ];

  const products = listAllProducts();

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
=======
// File placeholder per futura sitemap dinamica.
// Attualmente non contiene logica, come richiesto.

function generateSitemap() {
  // Da implementare in futuro
  return "";
>>>>>>> b6c9553 (Install axios)
}

module.exports = {
  generateSitemap
};
