// patcherloader.js
// Patcha TUTTE le pagine frontend + admin
// Inserisce dynamic-loader.js o dynamic-admin-loader.js come ULTIMO script
// Versione 20260412

const fs = require("fs");
const path = require("path");

// PERCORSI CORRETTI PER IL TUO PROGETTO
const ROOT = path.join(__dirname, "app/public");
const ADMIN_ROOT = path.join(__dirname, "app/public/admin");

function getAllHtmlFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
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

function patchHtml(filePath, isAdmin = false) {
  let html = fs.readFileSync(filePath, "utf8");

  const dynamicName = isAdmin
    ? "dynamic-admin-loader.js"
    : "dynamic-loader.js";

  if (html.includes(dynamicName)) {
    console.log("SKIP (già patchato):", filePath);
    return;
  }

  const scriptRegex = /<\/script>(?![\s\S]*<\/script>)/i;
  const match = html.match(scriptRegex);

  if (!match) {
    console.log("NESSUN <script> trovato:", filePath);
    return;
  }

  const insertPos = match.index + match[0].length;

  const injection = `
    <script src="/${isAdmin ? "admin/" : ""}${dynamicName}?v=20260412"></script>
  `;

  const patched = html.slice(0, insertPos) + injection + html.slice(insertPos);

  fs.writeFileSync(filePath, patched, "utf8");
  console.log("PATCHED:", filePath);
}

console.log("=== PATCHERLOADER AVVIATO ===");

const frontendFiles = getAllHtmlFiles(ROOT).filter(f => !f.includes("/admin/"));
frontendFiles.forEach(f => patchHtml(f, false));

const adminFiles = getAllHtmlFiles(ADMIN_ROOT);
adminFiles.forEach(f => patchHtml(f, true));

console.log("=== PATCH COMPLETATA ===");
