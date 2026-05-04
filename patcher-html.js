// =========================================================
// PATCHER HTML — Rimuove tutti i JS e lascia solo loader supremo
// Versione CommonJS (compatibile con Node del progetto)
// =========================================================

const fs = require("fs");
const path = require("path");

const ROOT_PUBLIC = "app/public";
const ROOT_ADMIN = "app/public/admin";

function getAllHTML(dir) {
  if (!fs.existsSync(dir)) return [];
    return fs.readdirSync(dir)
        .filter(f => f.endsWith(".html"))
            .map(f => path.join(dir, f));
            }

            function patchFile(file, isAdmin = false) {
              let html = fs.readFileSync(file, "utf8");

                // Rimuove TUTTI gli script <script ...>...</script>
                  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

                    // Rimuove anche script self-closing <script ...>
                      html = html.replace(/<script[^>]*>/gi, "");

                        // Inserisce il loader supremo PRIMA della chiusura </body>
                          const loaderTag = isAdmin
                              ? `<script src="/admin/loadersupremo-admin.js"></script>`
                                  : `<script src="/loadersupremo.js"></script>`;

                                    if (html.includes("</body>")) {
                                        html = html.replace("</body>", `${loaderTag}\n</body>`);
                                          } else {
                                              html += `\n${loaderTag}\n`;
                                                }

                                                  fs.writeFileSync(file, html, "utf8");
                                                    console.log("🟩 Patchato:", file);
                                                    }

                                                    function run() {
                                                      console.log("⏳ Patch HTML in corso…");

                                                        const publicFiles = getAllHTML(ROOT_PUBLIC);
                                                          const adminFiles = getAllHTML(ROOT_ADMIN);

                                                            publicFiles.forEach(f => patchFile(f, false));
                                                              adminFiles.forEach(f => patchFile(f, true));

                                                                console.log("✅ Patch HTML completata.");
                                                                }

                                                                run();