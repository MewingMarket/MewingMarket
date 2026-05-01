const fs = require("fs");
const path = require("path");

// =========================================================
// Utility: Legge ricorsivamente tutti i file
// =========================================================
function getAllFiles(dir, extFilter = null) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, extFilter));
    } else {
      if (!extFilter || filePath.endsWith(extFilter)) {
        results.push(filePath);
      }
    }
  });

  return results;
}

// =========================================================
// 1) Trova tutti i CSS
// =========================================================
const cssFiles = getAllFiles(".", ".css");
console.log("\n=== CSS TROVATI ===");
cssFiles.forEach(f => console.log("•", f));

// =========================================================
// 2) Trova tutti gli HTML/JS
// =========================================================
const htmlFiles = getAllFiles(".", ".html");
const jsFiles = getAllFiles(".", ".js");

// =========================================================
// 3) Mappa: quali CSS sono inclusi in quali HTML
// =========================================================
console.log("\n=== CSS INCLUSI NELLE PAGINE ===");

cssFiles.forEach(css => {
  const name = path.basename(css);
  let usedIn = [];

  htmlFiles.forEach(html => {
    const content = fs.readFileSync(html, "utf8");
    if (content.includes(name)) usedIn.push(html);
  });

  if (usedIn.length === 0) {
    console.log(`⚠️  ${name} NON USATO da nessuna pagina`);
  } else {
    console.log(`\n${name} usato in:`);
    usedIn.forEach(u => console.log("   →", u));
  }
});

// =========================================================
// 4) Estrae tutte le classi CSS
// =========================================================
function extractClasses(file) {
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(/\.[a-zA-Z0-9_-]+/g) || [];
  return [...new Set(matches.map(c => c.substring(1)))];
}

let classMap = {}; // { className: [file1, file2] }

cssFiles.forEach(css => {
  const classes = extractClasses(css);
  classes.forEach(cls => {
    if (!classMap[cls]) classMap[cls] = [];
    classMap[cls].push(css);
  });
});

// =========================================================
// 5) Classi duplicate tra CSS
// =========================================================
console.log("\n=== CLASSI DUPLICATE TRA CSS ===");

Object.entries(classMap)
  .filter(([cls, files]) => files.length > 1)
  .forEach(([cls, files]) => {
    console.log(`• .${cls} duplicata in:`);
    files.forEach(f => console.log("   →", f));
  });

// =========================================================
// 6) Classi non usate in nessun HTML/JS
// =========================================================
console.log("\n=== CLASSI NON USATE ===");

Object.entries(classMap).forEach(([cls, files]) => {
  let used = false;

  [...htmlFiles, ...jsFiles].forEach(file => {
    const content = fs.readFileSync(file, "utf8");
    if (content.includes(cls)) used = true;
  });

  if (!used) {
    console.log(`⚠️  .${cls} NON USATA (definita in ${files.join(", ")})`);
  }
});

console.log("\n=== SCAN COMPLETATO ===\n");
