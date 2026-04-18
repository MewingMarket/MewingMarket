/**
 * PATCHER HTML – MewingMarket
 * Versione 2027.001
 *
 * Funzioni:
 * - Rimuove TUTTI gli script dalle pagine
 * - Ricostruisce l’ordine corretto:
 *   PUBLIC:
 *     loader.js → dynamic-loader.js → js della pagina
 *   ADMIN:
 *     loader-admin.js → dynamic-admin-loader.js → js della pagina
 *
 * Sicuro, idempotente, non distrugge nulla.
 */

const fs = require("fs");
const path = require("path");

const VERSION = "20260412";

const PUBLIC_DIR = "app/public";
const ADMIN_DIR = "app/public/admin";

// ---------------------------------------------------------
// Utility: trova tutti gli HTML in una cartella
// ---------------------------------------------------------
function getHtmlFiles(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.endsWith(".html"))
    .map(f => path.join(dir, f));
}

// ---------------------------------------------------------
// Utility: estrae tutti gli script della pagina
// ---------------------------------------------------------
function extractScripts(html) {
  const regex = /<script[^>]*src=["']([^"']+)["'][^>]*><\/script>/gi;
  const scripts = [];
  let match;
  while ((match = regex.exec(html)) !== null) {
    scripts.push(match[1]);
  }
  return scripts;
}

// ---------------------------------------------------------
// Utility: rimuove tutti gli script dal codice HTML
// ---------------------------------------------------------
function removeAllScripts(html) {
  return html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "");
}

// ---------------------------------------------------------
// Ricostruisce gli script PUBLIC
// ---------------------------------------------------------
function buildPublicScripts(jsList) {
  let out = "";

  out += `<script src="loader.js?v=${VERSION}"></script>\n`;
  out += `<script src="/dynamic-loader.js?v=${VERSION}"></script>\n`;

  jsList.forEach(js => {
    out += `<script src="${js}?v=${VERSION}"></script>\n`;
  });

  return out;
}

// ---------------------------------------------------------
// Ricostruisce gli script ADMIN
// ---------------------------------------------------------
function buildAdminScripts(jsList) {
  let out = "";

  out += `<script src="/admin/loader-admin.js?v=${VERSION}"></script>\n`;
  out += `<script src="/admin/dynamic-admin-loader.js?v=${VERSION}"></script>\n`;

  jsList.forEach(js => {
    out += `<script src="/admin/${js}?v=${VERSION}"></script>\n`;
  });

  return out;
}

// ---------------------------------------------------------
// PATCHER PER UNA PAGINA
// ---------------------------------------------------------
function patchPage(filePath, isAdmin = false) {
  let html = fs.readFileSync(filePath, "utf8");

  // 1) Estrai tutti gli script
  const scripts = extractScripts(html);

  // 2) Filtra gli script della pagina (escludi loader)
  const pageScripts = scripts.filter(src => {
    return !src.includes("loader.js")
      && !src.includes("dynamic-loader.js")
      && !src.includes("loader-admin.js")
      && !src.includes("dynamic-admin-loader.js");
  });

  // 3) Rimuovi tutti gli script
  html = removeAllScripts(html);

  // 4) Ricostruisci blocco script
  const finalScripts = isAdmin
    ? buildAdminScripts(pageScripts)
    : buildPublicScripts(pageScripts);

  // 5) Inserisci PRIMA della chiusura </body>
  html = html.replace("</body>", finalScripts + "\n</body>");

  // 6) Salva
  fs.writeFileSync(filePath, html, "utf8");

  console.log(`✔ Patch applicata: ${filePath}`);
}

// ---------------------------------------------------------
// PATCH PUBLIC
// ---------------------------------------------------------
getHtmlFiles(PUBLIC_DIR).forEach(file => {
  if (!file.includes("/admin/")) {
    patchPage(file, false);
  }
});

// ---------------------------------------------------------
// PATCH ADMIN
// ---------------------------------------------------------
getHtmlFiles(ADMIN_DIR).forEach(file => {
  patchPage(file, true);
});
