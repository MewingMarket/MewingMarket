import fs from "fs";
import path from "path";

const root = process.cwd();
const pagesDir = path.join(root, "pages");
const publicDir = path.join(root, "app", "public");

// Assicura che la cartella public esista
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
  }

  // Copia i file da /pages a /app/public
  if (fs.existsSync(pagesDir)) {
    const files = fs.readdirSync(pagesDir);

      files.forEach(file => {
          const src = path.join(pagesDir, file);
              const dest = path.join(publicDir, file);

                  fs.copyFileSync(src, dest);
                      console.log(`✔ Copiato: ${file}`);
                        });
                        }

                        console.log("\n🎉 Build completata! I file sono pronti in /app/public\n");
                        