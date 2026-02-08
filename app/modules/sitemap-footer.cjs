// SITEMAP FOOTER DINAMICA — MEWINGMARKET 
function generateFooterSitemap() {
  const pagine = [
    "index.html",
    "catalogo.html",
    "chisiamo.html",
    "faq.html",
    "contatti.html",
    "dovesiamo.html",
    "resi.html",
    "privacy.html",
    "cookie.html",
    "termini-e-condizioni.html",
    "iscrizione.html",
    "disiscriviti.html"
  ];

  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  pagine.forEach((file) => {
    xml += `  <url>\n`;
    xml += `    <loc>https://www.mewingmarket.it/${file}</loc>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;
  return xml;
}

module.exports = { generateFooterSitemap };
