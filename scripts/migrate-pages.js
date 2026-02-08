import fs from "fs";
import path from "path";

const root = process.cwd();
const publicDir = path.join(root, "app", "public");
const pagesDir = path.join(root, "pages");

// Crea /pages se non esiste
if (!fs.existsSync(pagesDir)) {
  fs.mkdirSync(pagesDir);
    console.log("📁 Creata cartella /pages");
    }

    // Leggi tutti i file in /app/public
    const files = fs.readdirSync(publicDir);

    files.forEach(file => {
      if (file.endsWith(".html")) {
          const src = path.join(publicDir, file);
              const dest = path.join(pagesDir, file);

                  // Sposta il file
                      fs.renameSync(src, dest);

                          console.log(`✔ Spostato: ${file}`);
                            }
                            });

                            console.log("\n🎉 Migrazione completata! Tutti gli HTML ora sono in /pages\n");
                            