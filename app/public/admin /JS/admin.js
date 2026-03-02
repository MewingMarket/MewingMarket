document.addEventListener("DOMContentLoaded", () => {
  const logout = document.getElementById("logout-admin");
  if (logout) {
    logout.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("admin_token");
      window.location.href = "admin-login.html";
    });
  }
});
