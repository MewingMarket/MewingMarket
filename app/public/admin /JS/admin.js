// =========================================================
// File: app/public/admin/js/admin.js
// Controllo sessione admin
// =========================================================

function checkAdmin() {
  const token = localStorage.getItem("adminSession");

  if (!token) {
    window.location.href = "/admin/login.html";
    return;
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminSession");
  window.location.href = "/admin/login.html";
}

document.addEventListener("DOMContentLoaded", checkAdmin);
