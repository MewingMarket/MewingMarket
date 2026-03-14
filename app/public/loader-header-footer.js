// =========================================================
// LOADER — Riconoscimento automatico pagina
// =========================================================

const p = location.pathname.toLowerCase();

// 1) ADMIN
const isAdminPage = p.includes("/admin/");

// 2) GLOBALI (root)
const globalPages = [
  "index", "contatti", "cookie", "privacy", "termini", "condizioni",
  "faq", "recensioni", "tracking", "dovesiamo", "disiscriviti",
  "chisiamo", "chi-siamo"
];

const isGlobalPage = globalPages.some(name => p.includes(name));

// 3) SHOP
const shopPages = [
  "catalogo", "prodotto", "checkout", "shop", "categories"
];

const isShopPage = shopPages.some(name => p.includes(name));

// 4) USER
const userPages = [
  "dashboard", "ordini", "download",
  "reset-password", "reset-email", "elimina-account"
];

const isUserPage = userPages.some(name => p.includes(name));

// =========================================================
// DECISIONE HEADER
// =========================================================

let headerFile = "header.html"; // default globale

if (isAdminPage) {
  // L'admin ha il suo loader dedicato
  headerFile = null;

} else if (isShopPage) {
  headerFile = "header-shop.html";

} else if (isUserPage) {
  headerFile = "header.html"; // user usa header normale

} else if (isGlobalPage) {
  headerFile = "header.html";
}

// =========================================================
// CARICA AUTH SE SERVE
// =========================================================

const needsAuth = isShopPage || isUserPage || isAdminPage;

if (needsAuth) {
  const s = document.createElement("script");
  s.src = "auth.js";
  document.head.appendChild(s);
}

// =========================================================
// CARICA HEADER
// =========================================================

if (headerFile) {
  fetch(headerFile)
    .then(r => r.text())
    .then(html => {
      document.getElementById("header-placeholder").innerHTML = html;
      document.dispatchEvent(new Event("header-loaded"));

      if (headerFile === "header-shop.html") {
        const s = document.createElement("script");
        s.src = "header-shop.js";
        document.body.appendChild(s);
      }
    });
}

// =========================================================
// CARICA LOADER ADMIN
// =========================================================

document.addEventListener("auth-ready", () => {
  if (window.isAdmin) {
    const s = document.createElement("script");
    s.src = "admin/loader-admin.js";
    document.body.appendChild(s);
  }
});
