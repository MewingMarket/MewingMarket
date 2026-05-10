/* =========================================================
   PATCHER HTML 2050 — Inserisce loadersupremo + JS pagina
   Normalizza HTML, rimuove spazi vuoti, evita duplicazioni
========================================================= */

const fs = require("fs");
const path = require("path");

console.log("⚡ [PATCHER HTML] Avvio patcher...");

const ROOT = "./app/public";
const ADMIN = "./app/public/admin";
const VERSION = "2050";

/* =========================================================
   MAPPE DEFINITIVE
========================================================= */

const PUBLIC_MAP = {
  "index.html": "/index.js",
  "catalogo.html": "/catalogo.js",
  "prodotto.html": "/prodotto.js",
  "checkout.html": "/checkout.js",
  "assistenza.html": "/assistenza.js",
  "dashboard.html": "/dashboard.js",
  "disiscriviti.html": "/disiscriviti.js",
  "download.html": "/download.js",
  "elimina-account.html": "/elimina-account.js",
  "guide.html": "/guide.js",
  "iscrizione.html": "/iscrizione.js",
  "login.html": "/login.js",
  "profilo.html": "/profilo.js",
  "recensioni.html": "/recensioni.js",
  "registrazione.html": "/registrazione.js",
  "regolamento.html": "/regole.js",
  "reset-email-confirm.html": "/reset-email-confirm.js",
  "reset-email-request.html": "/reset-email-request.js",
  "reset-password-confirm.html": "/reset-password-confirm.js",
  "reset-password-request.html": "/reset-password-request.js",
  "rimborso.html": "/rimborso.js",
  "thankyou.html": "/thankyou.js",
  "top-recensioni.html": "/top-recensioni.js"
};

const NO_JS_PUBLIC = [
  "chisiamo.html",
  "contatti.html",
  "cookie.html"
];

const ADMIN_MAP = {
  "admin-confronto.html": "/admin/admin-confronto.js",
  "admin-prodotti.html": "/admin/admin-prodotti.js",
  "dashboard-admin-profilo.html": "/admin/dashboard-admin-profilo.js",
  "dashboard-admin-vendite-ordini.html": "/admin/dashboard-vendite-ordini.js",
  "feedback.html": "/admin/feedback.js",
  "utenti.html": "/admin/admin-utenti.js",
  "validizazione-prodotti.html": "/admin/validizazione-prodotti.js"
};

/* =========================================================
   FUNZIONE PATCH
========================================================= */

function patchFile(filePath, scriptPath) {
  let html = fs.readFileSync(filePath, "utf8");

  // Normalizza spazi
  html = html.replace(/\r/g, "").replace(/[ \t]+$/gm, "");

  // Rimuovi loadersupremo vecchi
  html = html.replace(/<script[^>]*loadersupremo[^>]*><\/script>/gi, "");

  // Inserisci loadersupremo corretto
  const loaderTag = `<script type="module" src="/loadersupremo.js?v=${VERSION}"></script>`;
  html = loaderTag + "\n" + html;

  // Se la pagina non ha JS → finito
  if (!scriptPath) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`⏭️ [NO JS] ${filePath}`);
    return;
  }

  // Se già presente → skip
  if (html.includes(scriptPath)) {
    fs.writeFileSync(filePath, html, "utf8");
    console.log(`⏭️ [SKIP] ${filePath} ha già ${scriptPath}`);
    return;
  }

  // Inserisci JS pagina subito dopo loadersupremo
  const snippet = `<script src="${scriptPath}?v=${VERSION}"></script>\n`;
  html = html.replace(loaderTag, loaderTag + "\n" + snippet);

  fs.writeFileSync(filePath, html, "utf8");
  console.log(`🟩 [PATCHED] ${filePath} → aggiunto ${scriptPath}`);
}

/* =========================================================
   PATCH PUBLIC
========================================================= */

for (const [file, script] of Object.entries(PUBLIC_MAP)) {
  if (NO_JS_PUBLIC.includes(file)) continue;

  const full = path.join(ROOT, file);
  if (fs.existsSync(full)) patchFile(full, script);
}

/* =========================================================
   PATCH ADMIN
========================================================= */

for (const [file, script] of Object.entries(ADMIN_MAP)) {
  const full = path.join(ADMIN, file);
  if (fs.existsSync(full)) patchFile(full, script);
}

console.log("🏁 [PATCHER HTML] Completato.");
