/* ============================
   FOOTER.JS
============================ */

document.addEventListener("footer-loaded", () => {
  console.log("FOOTER: footer-loaded ricevuto");

  const anno = document.getElementById("anno");
  if (anno) anno.textContent = new Date().getFullYear();

  const logged = window.isLogged;

  const loginLink = document.getElementById("footer-login");
  const registerLink = document.getElementById("footer-register");
  const dashboardLink = document.getElementById("footer-dashboard");
  const logoutLink = document.getElementById("footer-logout");

  if (logged) {
    if (loginLink) loginLink.style.display = "none";
    if (registerLink) registerLink.style.display = "none";
    if (dashboardLink) dashboardLink.style.display = "block";
    if (logoutLink) logoutLink.style.display = "block";
  } else {
    if (loginLink) loginLink.style.display = "block";
    if (registerLink) registerLink.style.display = "block";
    if (dashboardLink) dashboardLink.style.display = "none";
    if (logoutLink) logoutLink.style.display = "none";
  }

  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      logout();
    });
  }
});
