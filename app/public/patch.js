/**
 * PATCHER AUTOMATICO PER TUTTE LE PAGINE HTML
 * - Corregge head
 * - Rimuove placeholder illegali
 * - Inserisce header/footer placeholders
 * - Inserisce loader nel punto giusto
 * - Sposta tracking/seo/structured-data
 * - NON tocca admin/
 */

const fs = require("fs");
const path = require("path");

const PUBLIC_DIR = path.join(__dirname);

// Pagine shop
const SHOP_PAGES = ["catalogo.html", "prodotto.html", "checkout.html"];

// Script da gestire
const TRACKING = `<script src="tracking.js"></script>`;
const LOADER = `<script src="loader-header-footer.js"></script>`;
const SEO = `<script src="seo.js"></script>`;
const STRUCTURED = `<script src="structured-data.js"></script>`;

// Placeholder corretti
const HEADER_PH = `<div id="header-placeholder"></div>`;
const FOOTER_PH = `<div id="footer-placeholder"></div>`;

// Funzione principale
function patchHTML(filePath) {
  let html = fs.readFileSync(filePath, "utf8");
  const fileName = path.basename(filePath);

  console.log("Patch:", fileName);

  // 1) Rimuovi <div> illegali dentro <head>
  html = html.replace(/<head>[\s\S]*?<div id="head-placeholder"><\/div>/g, "<head>");

  // 2) Assicura che <head> sia pulito
  html = html.replace(/<div id="head-placeholder"><\/div>/g, "");

  // 3) Rimuovi header/footer hardcoded
  html = html.replace(/<header[\s\S]*?<\/header>/g, "");
  html = html.replace(/<footer[\s\S]*?<\/footer>/g, "");

  // 4) Inserisci header-placeholder se manca
  if (!html.includes("header-placeholder")) {
    html = html.replace("<body>", `<body>\n${HEADER_PH}\n`);
  }

  // 5) Inserisci footer-placeholder se manca
  if (!html.includes("footer-placeholder")) {
    html = html.replace("</main>", `</main>\n${FOOTER_PH}\n`);
  }

  // 6) Rimuovi vecchi script loader/seo/structured/tracking
  html = html
    .replace(/<script src="loader-header-footer\.js"><\/script>/g, "")
    .replace(/<script src="tracking\.js"><\/script>/g, "")
    .replace(/<script src="seo\.js"><\/script>/g, "")
    .replace(/<script src="structured-data\.js"><\/script>/g, "");

  // 7) Inserisci script nell’ordine corretto prima di </body>
  const scriptsFinali = `${TRACKING}\n${LOADER}\n${SEO}\n${STRUCTURED}\n</body>`;
  html = html.replace(/<\/body>/, scriptsFinali);

  // 8) Salva
  fs.writeFileSync(filePath, html, "utf8");
}

// Scansiona app/public/
fs.readdirSync(PUBLIC_DIR).forEach((file) => {
  const fullPath = path.join(PUBLIC_DIR, file);

  // Ignora admin/
  if (file === "admin") return;

  // Patcha solo .html
  if (file.endsWith(".html")) {
    patchHTML(fullPath);
  }
});

console.log("\nPatch completata.");
