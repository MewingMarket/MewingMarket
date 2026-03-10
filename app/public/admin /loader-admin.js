// =========================================================
// LOADER ADMIN – HEAD + HEADER + FOOTER + ACCESSO
// =========================================================

// ---------------------------------------------------------
// 1) CARICA HEAD ADMIN (come nel sito pubblico)
// ---------------------------------------------------------
fetch("head-admin.html")
  .then(r => r.text())
  .then(html => {
    const temp = document.createElement("div");
    temp.innerHTML = html;

    [...temp.children].forEach(node => document.head.appendChild(node));

    document.dispatchEvent(new Event("admin-head-loaded"));
  });


// ---------------------------------------------------------
// 2) CONTROLLO ACCESSO ADMIN (basato su ruolo normalizzato)
// ---------------------------------------------------------
async function checkAdminAccess() {
  try {
    const res = await fetch("/api/user/me", { credentials: "include" });
    if (!res.ok) throw new Error("Non loggato");

    const user = await res.json();

    // Normalizzazione ruolo
    const ruoloRaw = String(user.ruolo || "").trim().toLowerCase();
    let ruoloNorm = "user";

    if (
      ruoloRaw.includes("admin") ||
      ruoloRaw.includes("amministrator")
    ) {
      ruoloNorm = "admin";
    } else if (
      ruoloRaw.includes("user") ||
      ruoloRaw.includes("utente")
    ) {
      ruoloNorm = "user";
    } else if (
      ruoloRaw.includes("guest") ||
      ruoloRaw.includes("ospite")
    ) {
      ruoloNorm = "guest";
    }

    // Solo admin può entrare
    if (ruoloNorm !== "admin") {
      window.location.href = "/";
      return;
    }

    document.dispatchEvent(new Event("admin-auth-ok"));

  } catch (err) {
    console.error("Accesso admin negato:", err);
    window.location.href = "/";
  }
}

checkAdminAccess();


// ---------------------------------------------------------
// 3) CARICA HEADER ADMIN (con NAV dentro)
// ---------------------------------------------------------
document.addEventListener("admin-auth-ok", () => {
  fetch("header-admin.html")
    .then(r => r.text())
    .then(html => {
      document.getElementById("header-admin-placeholder").innerHTML = html;
      document.dispatchEvent(new Event("admin-header-loaded"));
    });
});


// ---------------------------------------------------------
// 4) CARICA FOOTER ADMIN
// ---------------------------------------------------------
fetch("footer-admin.html")
  .then(r => r.text())
  .then(html => {
    document.getElementById("footer-admin-placeholder").innerHTML = html;

    const year = document.getElementById("anno-admin");
    if (year) year.textContent = new Date().getFullYear();

    document.dispatchEvent(new Event("admin-footer-loaded"));
  });


// ---------------------------------------------------------
// 5) LOGOUT ADMIN
// ---------------------------------------------------------
document.addEventListener("admin-header-loaded", () => {
  const btn = document.getElementById("logout-admin");
  if (btn) {
    btn.addEventListener("click", async () => {
      await fetch("/api/user/logout", { method: "POST", credentials: "include" });
      window.location.href = "/";
    });
  }
});


// ---------------------------------------------------------
// 6) TITOLO DINAMICO (come nel sito pubblico)
// ---------------------------------------------------------
document.addEventListener("admin-head-loaded", () => {
  const metaTitle = document.querySelector('meta[id="dynamic-title"]');
  if (metaTitle) {
    document.title = metaTitle.content.trim();
  }
});
