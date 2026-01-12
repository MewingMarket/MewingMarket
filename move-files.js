const fs = require("fs");
const path = require("path");

const files = [
  "utils.js",
  "airtable.js",
  "catalogo.js",
  "bot.js",
  "sitemap.js"
];

const modulesDir = path.join(process.cwd(), "modules");

// Crea la cartella se non esiste
if (!fs.existsSync(modulesDir)) {
  fs.mkdirSync(modulesDir);
  console.log("Cartella /modules creata");
}

files.forEach(file => {
  const src = path.join(process.cwd(), file);
  const dest = path.join(modulesDir, file);

  if (fs.existsSync(src)) {
    fs.renameSync(src, dest);
    console.log(`Spostato: ${file}`);
  } else {
    console.log(`Non trovato: ${file}`);
  }
});

console.log("Operazione completata.");
