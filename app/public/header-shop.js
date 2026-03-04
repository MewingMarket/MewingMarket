// =========================================================
// HEADER SHOP – MewingMarket
// Compatibile con loader-header-footer.js
// =========================================================

document.addEventListener("header-loaded", () => {
  // Gli elementi del DOM ora esistono
  const navLogin = document.getElementById("nav-login");
  const navRegister = document.getElementById("nav-register");
  const navDashboard = document.getElementById("nav-dashboard");
  const navLogout = document.getElementById("nav-logout");

  // Se per qualche motivo il DOM non è ancora pronto, esci
  if (!navLogin || !navRegister || !navDashboard || !navLogout) {
    console.warn("Header shop: elementi non trovati.");
    return;
  }

  // Attendi che auth.js abbia caricato lo stato utente
  document.addEventListener("auth-ready", () => {
    const logged = isLogged();

    if (logged) {
      navLogin.style.display = "none";
      navRegister.style.display = "none";
      navDashboard.style.display = "inline-block";
      navLogout.style.display = "inline-block";
    } else {
      navLogin.style.display = "inline-block";
      navRegister.style.display = "inline-block";
      navDashboard.style.display = "none";
      navLogout.style.display = "none";
    }

    // Logout
    navLogout.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
      window.location.href = "index.html";
    });
  });
});
