// =========================================================
// SCANNER JS — Trova tutti i file .js in app/public
// =========================================================

import fs from "fs";
import path from "path";

const ROOT = "app/public";

function scanDir(dir) {
  const full = path.resolve(dir);
  if (!fs.existsSync(full)) return [];

  return fs.readdirSync(full)
    .filter(f => f.endsWith(".js"))
    .map(f => f);
}

function main() {
  const result = {
    public: scanDir(ROOT),
    admin: scanDir(path.join(ROOT, "admin"))
  };

  console.log(JSON.stringify(result, null, 2));
}

main();
