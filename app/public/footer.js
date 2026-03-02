document.addEventListener("DOMContentLoaded", () => {
  const anno = document.getElementById("anno");
  if (anno) anno.textContent = new Date().getFullYear();

  const logged = isLogged();

  const loginLink = document.getElementById("footer-login");
  const registerLink = document.getElementById("footer-register");
  const dashboardLink = document.getElementById("footer-dashboard");
  const logoutLink = document.getElementById("footer-logout");

  if (logged) {
    loginLink.style.display = "none";
    registerLink.style.display = "none";
    dashboardLink.style.display = "block";
    logoutLink.style.display = "block";
  } else {
    loginLink.style.display = "block";
    registerLink.style.display = "block";
    dashboardLink.style.display = "none";
    logoutLink.style.display = "none";
  }

  logoutLink.addEventListener("click", (e) => {
    e.preventDefault();
    logout();
  });
});
