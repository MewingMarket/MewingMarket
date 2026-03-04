/* =========================================================
   PATCH HTML — MewingMarket
      Inserisce gli script globali nell’ordine corretto
         Versione definitiva CommonJS
         ========================================================= */

         const fs = require("fs");
         const path = require("path");

         const ROOT = "./app/public";

         // Script globali da inserire in TUTTE le pagine HTML
         // (ordine corretto e definitivo)
         const scripts = `
         <script src="auth.js"></script>
         <script src="loader-header-footer.js"></script>
         <script src="carrello.js"></script>
         <script src="header-shop.js"></script>
         <script src="footer.js"></script>
         <script src="tracking.js"></script>
         <script src="structured-data.js"></script>
         <script src="seo.js"></script>
         `;

         // File HTML che NON devono essere patchati
         const skipFiles = [
           "header.html",
             "header-shop.html",
               "footer.html",
                 "head.html"
                 ];

                 function patchHTML(filePath) {
                   let html = fs.readFileSync(filePath, "utf8");

                     // Rimuove eventuali vecchi script già presenti
                       html = html.replace(/<script src="auth\.js"><\/script>/g, "");
                         html = html.replace(/<script src="loader-header-footer\.js"><\/script>/g, "");
                           html = html.replace(/<script src="carrello\.js"><\/script>/g, "");
                             html = html.replace(/<script src="header-shop\.js"><\/script>/g, "");
                               html = html.replace(/<script src="footer\.js"><\/script>/g, "");
                                 html = html.replace(/<script src="tracking\.js"><\/script>/g, "");
                                   html = html.replace(/<script src="structured-data\.js"><\/script>/g, "");
                                     html = html.replace(/<script src="seo\.js"><\/script>/g, "");

                                       // Inserisce gli script PRIMA della chiusura </body>
                                         html = html.replace("</body>", `${scripts}\n</body>`);

                                           fs.writeFileSync(filePath, html, "utf8");
                                             console.log("Patch applicata:", filePath);
                                             }

                                             function scan(dir) {
                                               const files = fs.readdirSync(dir);

                                                 for (const file of files) {
                                                     const fullPath = path.join(dir, file);
                                                         const stat = fs.statSync(fullPath);

                                                             if (stat.isDirectory()) {
                                                                   scan(fullPath);
                                                                         continue;
                                                                             }

                                                                                 if (file.endsWith(".html") && !skipFiles.includes(file)) {
                                                                                       patchHTML(fullPath);
                                                                                           }
                                                                                             }
                                                                                             }

                                                                                             scan(ROOT);