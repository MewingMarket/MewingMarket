/* =========================================================
   PATCHER HTML 2050 — Inserisce snippet JS di pagina
   Autore: Simone + Copilot
========================================================= */

const fs = require("fs");
const path = require("path");

console.log("⚡ [PATCHER HTML] Avvio patcher...");

const ROOT = "./app/public";
const ADMIN = "./app/public/admin";

const VERSION = "2050";

// Mappa pagine → script
const PAGE_MAP = {
  "index.html": "/index.js",
  "catalogo.html": "/catalogo.js",
  "prodotto.html": "/prodotto.js",
  "checkout.html": "/checkout.js",
  "assistenza.html": "/assistenza.js",
  "premium.html": "/premium.js"
};

// ADMIN
const ADMIN_MAP = {
  "dashboard.html": "/admin/dashboard.js",
  "admin-prodotti.html": "/admin/admin-prodotti.js",
  "admin-confronto.html": "/admin/admin-confronto.js"
};

// Funzione patch singolo file
function patchFile(filePath, scriptPath) {
  let html = fs.readFileSync(filePath, "utf8");

  // Se già presente → skip
  if (html.includes(scriptPath)) {
    console.log(`⏭️ [SKIP] ${filePath} ha già ${scriptPath}`);
    return;
  }

  // Trova loadersupremo
  const marker = '<script src="/loadersupremo.js"';
  const idx = html.indexOf(marker);

  if (idx === -1) {
    console.log(`⚠️ [NO LOADERSUPREMO] ${filePath} → skip`);
    return;
  }

  const insertPos = html.indexOf("</script>", idx) + "</script>".length;

  const snippet = `\n<script src="${scriptPath}?v=${VERSION}"></script>\n`;

  const patched = html.slice(0, insertPos) + snippet + html.slice(insertPos);

  fs.writeFileSync(filePath, patched, "utf8");

  console.log(`🟩 [PATCHED] ${filePath} → aggiunto ${scriptPath}`);
}

// Patch PUBLIC
for (const [file, script] of Object.entries(PAGE_MAP)) {
  const full = path.join(ROOT, file);
  if (fs.existsSync(full)) patchFile(full, script);
}

// Patch ADMIN
for (const [file, script] of Object.entries(ADMIN_MAP)) {
  const full = path.join(ADMIN, file);
  if (fs.existsSync(full)) patchFile(full, script);
}

console.log("🏁 [PATCHER HTML] Completato.");
