// =========================================================
// LOADER HEADER + FOOTER + HEAD – MewingMarket (PATCH)
// =========================================================

// =========================================================
// 0) AUTH — deve essere caricato prima di tutto
// =========================================================
const authScript = document.createElement("script");
authScript.src = "auth.js";
document.head.appendChild(authScript);

// ---------------------------------------------------------
// 1) HEAD
// ---------------------------------------------------------
fetch("head.html")
  .then(r => r.text())
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    [...temp.children].forEach(node => document.head.appendChild(node));
    document.dispatchEvent(new Event("head-loaded"));
  });

// ---------------------------------------------------------
// 2) DECISIONE HEADER
// ---------------------------------------------------------

const path = location.pathname;

// Pagine shop (vendita)
const isShopPage =
  path.includes("catalogo") ||
  path.includes("prodotto") ||
  path.includes("checkout");

// Pagine utente (dashboard e impostazioni)
const isUserPage =
  path.includes("dashboard") ||
  path.includes("reset-password") ||
  path.includes("reset-email") ||
  path.includes("elimina-account");

// ---------------------------------------------------------
// 2B) CARICA CARRELLO.JS PRIMA DELL’HEADER (solo pagine shop)
// ---------------------------------------------------------
if (isShopPage) {
  const s = document.createElement("script");
  s.src = "carrello.js";
  document.head.appendChild(s);
}

// Header da caricare
let headerFile = "header.html"; // default globale

if (isShopPage) headerFile = "header-shop.html";
if (isUserPage) headerFile = "header-user.html";

// ---------------------------------------------------------
// 2C) CARICA HEADER + EMETTI header-loaded
// ---------------------------------------------------------
fetch(headerFile)
  .then(r => r.text())
  .then(html => {
    document.getElementById("header-placeholder").innerHTML = html;

    // ⭐ PATCH: emetti SEMPRE dopo inserimento HTML
    document.dispatchEvent(new Event("header-loaded"));

    // Carica JS specifico dell’header
    if (headerFile === "header-shop.html") {
      const s = document.createElement("script");
      s.src = "header-shop.js";
      document.body.appendChild(s);
    }
  });

// ---------------------------------------------------------
// 3) FOOTER
// ---------------------------------------------------------
fetch("footer.html")
  .then(r => r.text())
  .then(html => {
    document.getElementById("footer-placeholder").innerHTML = html;

    const year = document.getElementById("anno");
    if (year) year.textContent = new Date().getFullYear();

    document.dispatchEvent(new Event("footer-loaded"));
  });

// ---------------------------------------------------------
// 4) POPUP POST-LOGIN
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("showLoginChoice") === "1") {
    localStorage.removeItem("showLoginChoice");

    const popup = document.createElement("div");
    popup.style.position = "fixed";
    popup.style.inset = "0";
    popup.style.background = "rgba(0,0,0,0.6)";
    popup.style.display = "flex";
    popup.style.justifyContent = "center";
    popup.style.alignItems = "center";
    popup.style.zIndex = "9999";

    popup.innerHTML = `
      <div style="
        background:white;
        padding:20px;
        border-radius:12px;
        text-align:center;
        width:80%;
        max-width:300px;
      ">
        <h3>Benvenuto!</h3>
        <p>Dove vuoi andare?</p>

        <button id="go-dashboard" style="
          margin-top:10px;
          width:100%;
          padding:10px;
          border:none;
          border-radius:8px;
          background:#007bff;
          color:white;
          font-size:16px;
        ">Vai al profilo</button>

        <button id="go-shop" style="
          margin-top:10px;
          width:100%;
          padding:10px;
          border:none;
          border-radius:8px;
          background:#ddd;
          color:#333;
          font-size:16px;
        ">Continua a navigare</button>
      </div>
    `;

    document.body.appendChild(popup);

    document.getElementById("go-dashboard").onclick = () => {
      location.href = "dashboard.html";
    };

    document.getElementById("go-shop").onclick = () => {
      popup.remove();
    };
  }
});

// ---------------------------------------------------------
// 5) MOSTRA IL PULSANTE ADMIN (PATCH: timing corretto)
// ---------------------------------------------------------

let headerReady = false;
let authReady = false;

document.addEventListener("header-loaded", () => {
  headerReady = true;
  tryShowAdminButton();
});

document.addEventListener("auth-ready", () => {
  authReady = true;
  tryShowAdminButton();
});

function tryShowAdminButton() {
  if (!headerReady || !authReady) return;

  if (window.isAdmin) {
    const adminBtn = document.getElementById("admin-trigger");
    if (adminBtn) adminBtn.style.display = "inline-flex";
  }
      }
