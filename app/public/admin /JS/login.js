async function loginAdmin() {
  const password = document.getElementById("adminPassword").value;
  const status = document.getElementById("status");

  status.textContent = "Verifica in corso...";
  status.style.color = "#003366";

  try {
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "admin",
        password
      })
    });

    const data = await res.json();

    if (!data.success) {
      status.textContent = data.error || "Errore login";
      status.style.color = "red";
      return;
    }

    localStorage.setItem("admin_token", data.token);

    status.textContent = "Accesso effettuato!";
    status.style.color = "green";

    setTimeout(() => {
      window.location.href = "/admin/dashboard.html";
    }, 600);

  } catch (err) {
    console.error(err);
    status.textContent = "Errore server";
    status.style.color = "red";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("loginBtn").addEventListener("click", loginAdmin);
});
