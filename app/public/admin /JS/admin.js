// app/public/admin/js/admin.js

function getAdminToken() {
  return localStorage.getItem("adminToken");
}

function requireAdmin() {
  const token = getAdminToken();
  if (!token) {
    window.location.href = "login.html";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (!location.pathname.endsWith("login.html")) {
    requireAdmin();
  }

  const logoutLink = document.getElementById("logout-admin");
  if (logoutLink) {
    logoutLink.addEventListener("click", (e) => {
      e.preventDefault();
      localStorage.removeItem("adminToken");
      window.location.href = "login.html";
    });
  }
});

async function adminFetch(url, options = {}) {
  const token = getAdminToken();
  const headers = Object.assign(
    {},
    options.headers || {},
    token ? { Authorization: `Bearer ${token}` } : {}
  );
  const res = await fetch(url, { ...options, headers });
  return res;
}
