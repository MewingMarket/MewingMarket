const fs = require("fs");
const path = require("path");

const ROOT = "./app/public";

const scripts = `
<script src="auth.js"></script>
<script src="loader-header-footer.js"></script>
<script src="header-shop.js"></script>
<script src="footer.js"></script>
<script src="tracking.js"></script>
<script src="structured-data.js"></script>
<script src="seo.js"></script>
`;

const SKIP_FILES = [
  "footer.html",
    "head.html",
      "header.html",
        "header-shop.html"
        ];

        // Rimuove vecchi script e fetch inline
        function removeOldScriptLines(content) {
          return content
              .split("\n")
                  .filter(line => !line.includes("fetch(\"header.html\""))
                      .filter(line => !line.includes("fetch(\"footer.html\""))
                          .filter(line => !line.includes("src=\"/"))
                              .filter(line => !line.includes("auth.js"))
                                  .filter(line => !line.includes("header-shop.js"))
                                      .filter(line => !line.includes("footer.js"))
                                          .filter(line => !line.includes("tracking.js"))
                                              .filter(line => !line.includes("structured-data.js"))
                                                  .filter(line => !line.includes("seo.js"))
                                                      .filter(line => !line.includes("loader-header-footer.js"))
                                                          .join("\n");
                                                          }

                                                          function patchFile(filePath) {
                                                            const normalized = filePath.replace(/\\/g, "/");

                                                              // Salta admin
                                                                if (normalized.includes("/admin/")) return;

                                                                  // Salta file che non vanno patchati
                                                                    if (SKIP_FILES.some(name => normalized.endsWith(name))) return;

                                                                      let content = fs.readFileSync(filePath, "utf8");

                                                                        // Se non contiene <body> → skip
                                                                          if (!content.includes("<body")) {
                                                                              console.log("⚠ Nessun <body> trovato in:", normalized);
                                                                                  return;
                                                                                    }

                                                                                      // Rimuove vecchi script e fetch inline
                                                                                        content = removeOldScriptLines(content);

                                                                                          // Inserisce gli script nuovi subito dopo <body>
                                                                                            content = content.replace("<body>", `<body>\n${scripts}`);

                                                                                              fs.writeFileSync(filePath, content, "utf8");
                                                                                                console.log("Patchato:", normalized);
                                                                                                }

                                                                                                function scan(dir) {
                                                                                                  fs.readdirSync(dir).forEach(item => {
                                                                                                      const full = path.join(dir, item);
                                                                                                          const stat = fs.statSync(full);

                                                                                                              if (stat.isDirectory()) {
                                                                                                                    scan(full);
                                                                                                                        } else if (item.endsWith(".html")) {
                                                                                                                              patchFile(full);
                                                                                                                                  }
                                                                                                                                    });
                                                                                                                                    }

                                                                                                                                    scan(ROOT);