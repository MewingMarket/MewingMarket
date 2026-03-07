/**
 * ============================================================
 *  FRONT-END SCANNER – MewingMarket (Versione 2.0)
 *  Scansiona TUTTI gli HTML in app/public e genera un report.
 * ============================================================
 */

const fs = require("fs");
const path = require("path");

// Cartella da scansionare
const ROOT = path.join(__dirname, "app/public");

// Report finale
let REPORT = {
  ok: [],
  errors: [],
  warnings: [],
  orphanFiles: []
};

// Utility logging
function logOK(file) {
  REPORT.ok.push(file);
}

function logError(file, msg) {
  REPORT.errors.push({ file, msg });
}

function logWarning(file, msg) {
  REPORT.warnings.push({ file, msg });
}

// Legge tutti i file HTML ricorsivamente
function getAllHtmlFiles(dir) {
  let results = [];

  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);

    if (stat.isDirectory()) {
      results = results.concat(getAllHtmlFiles(full));
    } else if (file.endsWith(".html")) {
      results.push(full);
    }
  });

  return results;
}

// ============================================================
//  A) CONTROLLI STRUTTURALI HTML
// ============================================================

function checkPlaceholders(file, content) {
  if (!content.includes("head-placeholder")) logError(file, "Manca head-placeholder");
  if (!content.includes("header-placeholder")) logError(file, "Manca header-placeholder");
  if (!content.includes("footer-placeholder")) logError(file, "Manca footer-placeholder");
}

function checkStaticHeader(file, content) {
  const patterns = ["<header", "<nav", "class=\"header", "id=\"header\""];
  patterns.forEach(p => {
    if (content.includes(p)) logError(file, "Header statico trovato: " + p);
  });
}

function checkStaticFooter(file, content) {
  const patterns = ["<footer", "class=\"footer", "id=\"footer\""];
  patterns.forEach(p => {
    if (content.includes(p)) logError(file, "Footer statico trovato: " + p);
  });
}

function checkInlineCSS(file, content) {
  if (content.includes("style=\"")) logWarning(file, "CSS inline trovato");
}

function checkInlineScripts(file, content) {
  const inlineScriptRegex = /<script>([\s\S]*?)<\/script>/g;
  if (inlineScriptRegex.test(content)) logWarning(file, "Script inline trovato");
}

function checkUnclosedTags(file, content) {
  const tags = ["div", "span", "p", "main", "section"];
  tags.forEach(tag => {
    const open = (content.match(new RegExp(`<${tag}`, "g")) || []).length;
    const close = (content.match(new RegExp(`</${tag}>`, "g")) || []).length;
    if (open !== close) logWarning(file, `Tag non chiusi: <${tag}> (${open} aperti, ${close} chiusi)`);
  });
}

// ============================================================
//  B) CONTROLLI JS
// ============================================================

function checkMissingJS(file, content) {
  const regex = /<script src="(.*?)"><\/script>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const jsPath = path.join(ROOT, match[1]);
    if (!fs.existsSync(jsPath)) logError(file, "File JS mancante: " + match[1]);
  }
}

function checkDuplicateScripts(file, content) {
  const scripts = {};
  const regex = /<script src="(.*?)"><\/script>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const src = match[1];
    scripts[src] = (scripts[src] || 0) + 1;
  }

  Object.keys(scripts).forEach(src => {
    if (scripts[src] > 1) logError(file, "Script duplicato: " + src);
  });
}

// ============================================================
//  C) CONTROLLI CSS
// ============================================================

function checkMissingCSS(file, content) {
  const regex = /<link rel="stylesheet" href="(.*?)">/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const cssPath = path.join(ROOT, match[1]);
    if (!fs.existsSync(cssPath)) logError(file, "File CSS mancante: " + match[1]);
  }
}

// ============================================================
//  D) CONTROLLI IMMAGINI
// ============================================================

function checkMissingImages(file, content) {
  const regex = /<img.*?src="(.*?)"/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const imgPath = path.join(ROOT, match[1]);
    if (!fs.existsSync(imgPath)) logWarning(file, "Immagine mancante: " + match[1]);
  }
}

// ============================================================
//  E) CONTROLLI SEO
// ============================================================

function checkSEO(file, content) {
  if (!content.includes("<title>")) logWarning(file, "Manca <title>");
  if (!content.includes("meta name=\"description\"")) logWarning(file, "Manca meta description");
}

// ============================================================
//  F) CONTROLLI ACCESSIBILITÀ
// ============================================================

function checkAccessibility(file, content) {
  if (content.includes("<img") && !content.includes("alt=")) {
    logWarning(file, "Immagine senza alt");
  }
}

// ============================================================
//  G) CLASSIFICAZIONE PAGINA
// ============================================================

function classifyPage(file, content) {
  const name = path.basename(file);

  if (name.includes("catalogo") || name.includes("prodotto")) return "shop";
  if (name.includes("dashboard") || name.includes("reset") || name.includes("elimina")) return "user";
  return "global";
}

// ============================================================
//  H) LOGICA PER TIPO PAGINA
// ============================================================

function checkPageLogic(file, content, type) {
  if (type === "shop") {
    if (!content.includes("carrello.js")) logError(file, "Pagina shop senza carrello.js");
  }

  if (type === "user") {
    if (content.includes("carrello.js")) logError(file, "Pagina utente contiene carrello.js");
  }

  if (type === "global") {
    if (content.includes("carrello.js")) logError(file, "Pagina globale contiene carrello.js");
  }
}

// ============================================================
//  I) FILE ORFANI
// ============================================================

function detectOrphanFiles(htmlFiles) {
  const allLinks = new Set();

  htmlFiles.forEach(file => {
    const content = fs.readFileSync(file, "utf8");
    const regex = /href="(.*?)"/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      allLinks.add(match[1]);
    }
  });

  htmlFiles.forEach(file => {
    const name = path.basename(file);
    if (!allLinks.has(name) && !name.includes("index")) {
      REPORT.orphanFiles.push(name);
    }
  });
}

// ============================================================
//  SCANSIONE PRINCIPALE
// ============================================================

function scan() {
  console.log("🔍 Scansione in corso...\n");

  const files = getAllHtmlFiles(ROOT);

  files.forEach(file => {
    const content = fs.readFileSync(file, "utf8");

    // Controlli strutturali
    checkPlaceholders(file, content);
    checkStaticHeader(file, content);
    checkStaticFooter(file, content);
    checkInlineCSS(file, content);
    checkInlineScripts(file, content);
    checkUnclosedTags(file, content);

    // JS
    checkMissingJS(file, content);
    checkDuplicateScripts(file, content);

    // CSS
    checkMissingCSS(file, content);

    // Immagini
    checkMissingImages(file, content);

    // SEO
    checkSEO(file, content);

    // Accessibilità
    checkAccessibility(file, content);

    // Logica pagina
    const type = classifyPage(file, content);
    checkPageLogic(file, content, type);

    // Se nessun errore → OK
    if (!REPORT.errors.some(e => e.file === file)) {
      logOK(file);
    }
  });

  detectOrphanFiles(files);

  // Report finale
  console.log("=== REPORT FINALE ===\n");

  console.log("OK:", REPORT.ok.length);
  REPORT.ok.forEach(f => console.log("  ✔", f));

  console.log("\nERRORI:", REPORT.errors.length);
  REPORT.errors.forEach(e => console.log("  ❌", e.file, "→", e.msg));

  console.log("\nWARNING:", REPORT.warnings.length);
  REPORT.warnings.forEach(w => console.log("  ⚠️", w.file, "→", w.msg));

  console.log("\nFILE ORFANI:", REPORT.orphanFiles.length);
  REPORT.orphanFiles.forEach(f => console.log("  🗑️", f));
}

scan();
