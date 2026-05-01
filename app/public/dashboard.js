/* =========================================================
   DASHBOARD.JS — UNIVERSAL JSON PATCH 2027.970
   Gestione Sidebar Utente
========================================================= */

document.addEventListener("critical-ready", async () => {
  const token = localStorage.getItem("token");
  if (!token) return;

  const data = await apiSidebar("/api/utenti/me", { method: "GET" });
  if (!data || !data.utente) return;

  const u = data.utente;

  const emailEl = document.getElementById("sidebarEmail");
  const userEl = document.getElementById("sidebarUsername");
  const cfEl = document.getElementById("sidebarCF");

  if (emailEl) emailEl.textContent = u.email;
  if (userEl) userEl.textContent = u.username || u.email.split("@")[0];
  if (cfEl) cfEl.textContent = u.codice_fiscale || "";
});

/* =========================================================
   WRAPPER UNIVERSALE (token + universal-json)
========================================================= */
async function apiSidebar(path, options = {}) {
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    Authorization: token ? `Bearer ${token}` : ""
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  if (res.status === 401 || res.status === 403) {
    localStorage.removeItem("token");
    window.location.href = "login.html";
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
