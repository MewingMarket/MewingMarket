// SITEMAP FOOTER DINAMICA — MEWINGMARKET (blindata)

const { cleanURL, safeText } = require("./utils.cjs");

/* =========================================================
   GENERA SITEMAP FOOTER (blindata)
========================================================= */
function generateFooterSitemap() {
  try {
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
      const safeFile = safeText(file);
      const url = cleanURL(`https://www.mewingmarket.it/${safeFile}`);

      if (!url) return; // evita URL rotti

      xml += `  <url>\n`;
      xml += `    <loc>${url}</loc>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;

  } catch (err) {
    console.error("Errore generateFooterSitemap:", err);
    return `<?xml version="1.0" encoding="UTF-8"?><urlset></urlset>`;
  }
}

module.exports = { generateFooterSitemap };
