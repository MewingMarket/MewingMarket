const fs = require("fs");
const path = require("path");

function getAllFiles(dir, ext = null) {
  let results = [];
  const list = fs.readdirSync(dir);

  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      results = results.concat(getAllFiles(filePath, ext));
    } else {
      if (!ext || filePath.endsWith(ext)) results.push(filePath);
    }
  });

  return results;
}

function extractClasses(file) {
  const content = fs.readFileSync(file, "utf8");
  const matches = content.match(/\.[a-zA-Z0-9_-]+/g) || [];
  return [...new Set(matches.map(c => c.substring(1)))];
}

function generateReport() {
  const cssFiles = getAllFiles(".", ".css");
  const htmlFiles = getAllFiles(".", ".html");
  const jsFiles = getAllFiles(".", ".js");

  let html = `
  <html>
  <head>
    <title>CSS Report</title>
    <style>
      body { font-family: Arial; padding: 20px; }
      h2 { margin-top: 40px; }
      .warn { color: #c00; font-weight: bold; }
      .ok { color: #090; }
      pre { background: #f4f4f4; padding: 10px; }
    </style>
  </head>
  <body>
  <h1>CSS Report 2027</h1>
  `;

  // CSS trovati
  html += `<h2>CSS trovati</h2><ul>`;
  cssFiles.forEach(f => html += `<li>${f}</li>`);
  html += `</ul>`;

  // CSS inclusi
  html += `<h2>CSS inclusi nelle pagine</h2>`;
  cssFiles.forEach(css => {
    const name = path.basename(css);
    let usedIn = [];

    htmlFiles.forEach(htmlFile => {
      const content = fs.readFileSync(htmlFile, "utf8");
      if (content.includes(name)) usedIn.push(htmlFile);
    });

    if (usedIn.length === 0) {
      html += `<p class="warn">${name} NON usato da nessuna pagina</p>`;
    } else {
      html += `<p><b>${name}</b> usato in:</p><ul>`;
      usedIn.forEach(u => html += `<li>${u}</li>`);
      html += `</ul>`;
    }
  });

  // Classi duplicate
  html += `<h2>Classi duplicate tra CSS</h2>`;
  let classMap = {};

  cssFiles.forEach(css => {
    const classes = extractClasses(css);
    classes.forEach(cls => {
      if (!classMap[cls]) classMap[cls] = [];
      classMap[cls].push(css);
    });
  });

  Object.entries(classMap)
    .filter(([cls, files]) => files.length > 1)
    .forEach(([cls, files]) => {
      html += `<p class="warn">.${cls} duplicata in:</p><ul>`;
      files.forEach(f => html += `<li>${f}</li>`);
      html += `</ul>`;
    });

  // Classi non usate
  html += `<h2>Classi NON usate</h2>`;
  Object.entries(classMap).forEach(([cls, files]) => {
    let used = false;

    [...htmlFiles, ...jsFiles].forEach(file => {
      const content = fs.readFileSync(file, "utf8");
      if (content.includes(cls)) used = true;
    });

    if (!used) {
      html += `<p class="warn">.${cls} non usata (in ${files.join(", ")})</p>`;
    }
  });

  html += `</body></html>`;

  fs.writeFileSync("report-css.html", html);
  console.log("✔ report-css.html generato");
}

generateReport();
