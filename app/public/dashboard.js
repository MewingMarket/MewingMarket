// =========================================================
// DASHBOARD.JS — Versione DEFINITIVA (2026)
// Sincronizzato con auth-ready + token + SQL
// =========================================================

console.log("[DASHBOARD] Caricato");

// Attende auth-ready PRIMA di iniziare
document.addEventListener("auth-ready", initDashboard);

async function initDashboard() {
  console.log("[DASHBOARD] initDashboard()");

  // -------------------------------------------------------
  // 1) Verifica login
  // -------------------------------------------------------
  if (!window.isLogged) {
    console.warn("[DASHBOARD] Utente non loggato → redirect login");
    window.location.href = "login.html";
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    console.warn("[DASHBOARD] Nessun token → redirect login");
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // -------------------------------------------------------
  // 2) Carica dati utente
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/utenti/me", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /me:", data);

    if (res.status === 401 || !data.success) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      localStorage.clear();
      window.location.href = "login.html";
      return;
    }

    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
  }

  // -------------------------------------------------------
  // 3) Carica ordini
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/ordini/miei", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /ordini/miei:", data);

    if (res.status !== 401) {
      updateOrdersUI(data.ordini || []);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore ordini:", err);
  }

  // -------------------------------------------------------
  // 4) Carica download
  // -------------------------------------------------------
  try {
    const res = await fetch("/api/download/miei", {
      method: "GET",
      headers: authHeaders
    });

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /download/miei:", data);

    if (res.status !== 401) {
      updateDownloadsUI(data.download || []);
    }

  } catch (err) {
    console.error("[DASHBOARD] Errore download:", err);
  }
}

// =========================================================
// UI FUNCTIONS
// =========================================================

function updateUserUI(user) {
  if (!user) return;

  const elEmail = document.getElementById("user-email");
  const elRuolo = document.getElementById("user-role");

  if (elEmail) elEmail.textContent = user.email || "";
  if (elRuolo) elRuolo.textContent = user.ruolo || "user";

  localStorage.setItem("email", user.email || "");
  localStorage.setItem("ruolo", user.ruolo || "user");
}

function updateOrdersUI(ordini) {
  const container = document.getElementById("orders-list");
  if (!container) return;

  if (!ordini.length) {
    container.innerHTML = "<p>Nessun ordine disponibile.</p>";
    return;
  }

  container.innerHTML = "";

  ordini.forEach((o) => {
    const div = document.createElement("div");
    div.className = "order-item";

    div.innerHTML = `
      <p><strong>ID ordine:</strong> ${o.id}</p>
      <p><strong>Data:</strong> ${o.data}</p>
      <p><strong>Totale:</strong> €${(o.totale_cent / 100).toFixed(2)}</p>
    `;

    container.appendChild(div);
  });
}

function updateDownloadsUI(downloads) {
  const container = document.getElementById("downloads-list");
  if (!container) return;

  if (!downloads.length) {
    container.innerHTML = "<p>Nessun download disponibile.</p>";
    return;
  }

  container.innerHTML = "";

  downloads.forEach((d) => {
    const div = document.createElement("div");
    div.className = "download-item";

    div.innerHTML = `
      <p><strong>${d.titolo}</strong></p>
      <a href="${d.url}" class="btn" download>Scarica</a>
    `;

    container.appendChild(div);
  });
}
