/* =========================================================
   PATCH HTML — MewingMarket
      Inserisce gli script globali nell’ordine corretto
         Versione definitiva 2026
         ========================================================= */

         import fs from "fs";
         import path from "path";

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

                 // Funzione principale
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

                                             // Scansione ricorsiva della cartella
                                             function scan(dir) {
                                               const files = fs.readdirSync(dir);

                                                 for (const file of files) {
                                                     const fullPath = path.join(dir, file);

                                                         if (fs.statSync(fullPath).isDirectory()) {
                                                               scan(fullPath);
                                                                     return;
                                                                         }

                                                                             if (file.endsWith(".html") && !skipFiles.includes(file)) {
                                                                                   patchHTML(fullPath);
                                                                                       }
                                                                                         }
                                                                                         }

                                                                                         scan(ROOT); 