// patcherloader.js
// Inserisce dynamic-loader.js come ULTIMO script in ogni pagina HTML
// senza rinominare loader.js e senza duplicare nulla.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "public");

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

function patchHtml(filePath) {
  let html = fs.readFileSync(filePath, "utf8");

  // Evita duplicazioni
  if (html.includes("dynamic-loader.js")) {
    console.log("SKIP (già patchato):", filePath);
    return;
  }

  // Trova l'ultimo </script> prima di </body>
  const scriptRegex = /<\/script>(?![\s\S]*<\/script>)/i;
  const match = html.match(scriptRegex);

  if (!match) {
    console.log("NESSUN <script> trovato, salto:", filePath);
    return;
  }

  const insertPos = match.index + match[0].length;

  const injection = `
    <script src="/dynamic-loader.js?v=20260412"></script>
  `;

  const patched = html.slice(0, insertPos) + injection + html.slice(insertPos);

  fs.writeFileSync(filePath, patched, "utf8");
  console.log("PATCHED:", filePath);
}

const files = getAllHtmlFiles(ROOT);
files.forEach(patchHtml);

console.log("Patch completata.");
