const fs = require("fs");
const path = require("path");

const directory = "./app/public";

const scripts = `
<script src="/auth.js"></script>
<script src="/header-shop.js"></script>
<script src="/footer.js"></script>
<script src="/tracking.js"></script>
<script src="/structured-data.js"></script>
<script src="/seo.js"></script>
`;

function patchFile(filePath) {
  let content = fs.readFileSync(filePath, "utf8");

  // evita admin
  if (filePath.includes("/admin/")) return;

  // evita doppio inserimento
  if (content.includes("auth.js")) return;

  // PATCH HEAD FETCH: rimuove DOMContentLoaded
  content = content.replace(
    /document\.addEventListener\("DOMContentLoaded",\s*\(\)\s*=>\s*\{/g,
    ""
  );
  content = content.replace(/\}\);/g, "");

  // inserisci subito dopo <body>
  content = content.replace("<body>", `<body>\n${scripts}`);

  fs.writeFileSync(filePath, content, "utf8");
  console.log("Patchato:", filePath);
}

function scan(dir) {
  fs.readdirSync(dir).forEach(file => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      scan(full);
    } else if (file.endsWith(".html")) {
      patchFile(full);
    }
  });
}

scan(directory);
