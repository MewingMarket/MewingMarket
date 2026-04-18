// =========================================================
// DASHBOARD.JS — Versione FINALE (PATCH 2027.400)
// Compatibile con auth-user + apiFetch + fetchUniversale
// =========================================================

console.log("[DASHBOARD] Caricato");

// La dashboard parte SOLO dopo critical-ready
document.addEventListener("critical-ready", initDashboard);

async function initDashboard() {
  console.log("[DASHBOARD] initDashboard()");

  // -------------------------------------------------------
  // 1) Verifica stato sessione
  // -------------------------------------------------------
  const token = localStorage.getItem("token");
  const sessionState = parseInt(localStorage.getItem("sessionState") || "0", 10);

  if (!token || !window.isLogged || sessionState !== 1) {
    console.warn("[DASHBOARD] Nessuna sessione valida → redirect login");
    window.location.href = "login.html";
    return;
  }

  const authHeaders = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + token
  };

  // -------------------------------------------------------
  // 3) Carica dati utente (/me)
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/utenti/me",
      { method: "GET", headers: authHeaders },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /me:", data);

    if (res.status === 401 || !data.success || !data.utente) {
      console.warn("[DASHBOARD] Sessione non valida → logout");
      logoutAndRedirect();
      return;
    }

    updateUserUI(data.utente);

  } catch (err) {
    console.error("[DASHBOARD] Errore caricamento utente:", err);
    alert("Errore di connessione.");
    return;
  }

  // -------------------------------------------------------
  // 4) Ordini — alias /ordini/utente
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/ordini/utente",
      { method: "GET", headers: authHeaders },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /ordini/utente:", data);

    if (res.status === 401) {
      console.warn("[DASHBOARD] 401 su ordini → logout");
      logoutAndRedirect();
      return;
    }

    updateOrdersUI(Array.isArray(data.ordini) ? data.ordini : []);

  } catch (err) {
    console.error("[DASHBOARD] Errore ordini:", err);
    updateOrdersUI([]);
  }

  // -------------------------------------------------------
  // 5) Download — alias /download/miei
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/download/miei",
      { method: "GET", headers: authHeaders },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /download/miei:", data);

    if (res.status === 401) {
      console.warn("[DASHBOARD] 401 su download → logout");
      logoutAndRedirect();
      return;
    }

    updateDownloadsUI(Array.isArray(data.download) ? data.download : []);

  } catch (err) {
    console.error("[DASHBOARD] Errore download:", err);
    updateDownloadsUI([]);
  }
}

// =========================================================
// AGGIORNA UI UTENTE — EMAIL + USERNAME + CF
// =========================================================
function updateUserUI(utente) {
  if (!utente) return;

  const email = utente.email || "";
  const usernameCalc = email ? email.split("@")[0] : "";
  const cf = utente.codice_fiscale || "";

  const sidebarEmail = document.getElementById("sidebarEmail");
  const sidebarUsername = document.getElementById("sidebarUsername");
  const sidebarCF = document.getElementById("sidebarCF");

  if (sidebarEmail) sidebarEmail.textContent = email;
  if (sidebarUsername) sidebarUsername.textContent = usernameCalc;
  if (sidebarCF) sidebarCF.textContent = cf;

  const userEmail = document.getElementById("userEmail");
  const userUsername = document.getElementById("username");
  const userCF = document.getElementById("userCF");

  if (userEmail) userEmail.textContent = email;
  if (userUsername) userUsername.textContent = usernameCalc;
  if (userCF) userCF.textContent = cf;
}

// =========================================================
// LOGOUT PULITO
// =========================================================
function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.removeItem("email");
  localStorage.removeItem("ruolo");
  localStorage.setItem("sessionState", "0");
  window.location.href = "login.html";
}

// =========================================================
// PATCH — updateOrdersUI() + updateDownloadsUI()
// =========================================================

async function updateOrdersUI(ordini = null) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("ordersList");

  if (!token) {
    container.innerHTML = "<p>Non loggato.</p>";
    return;
  }

  if (!ordini) {
    try {
      const res = await window.fetchUniversale(
        "/ordini/utente",
        { headers: { "Authorization": "Bearer " + token } },
        { retries: 2, backoffMs: 300 }
      );
      const data = await res.json();
      ordini = data.ordini || [];
    } catch {
      ordini = [];
    }
  }

  if (!Array.isArray(ordini) || ordini.length === 0) {
    container.innerHTML = "<p>Nessun ordine trovato.</p>";
    return;
  }

  container.innerHTML = ordini
    .map(o => {
      const prodottiHTML = o.prodotti
        .map(p => {
          const prezzo = (p.prezzo_cent / 100).toFixed(2);
          const titolo = p.titolo || p.titolo_breve || "Prodotto digitale";
          return `${titolo} (${prezzo}€ × ${p.qty || 1})`;
        })
        .join("<br>");

      const totaleEuro = (o.totale_cent / 100).toFixed(2);

      return `
        <div class="ordine-box">
          <div><strong>Data:</strong> ${new Date(o.data).toLocaleDateString("it-IT")}</div>
          <div><strong>Prodotti:</strong><br>${prodottiHTML}</div>
          <div><strong>Totale:</strong> ${totaleEuro}€</div>
          <div><strong>Stato:</strong> ${o.stato}</div>
        </div>
      `;
    })
    .join("");
}

async function updateDownloadsUI(download = null) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("downloadsList");

  if (!token) {
    container.innerHTML = "<p>Non loggato.</p>";
    return;
  }

  if (!download) {
    try {
      const res = await window.fetchUniversale(
        "/ordini/utente",
        { headers: { "Authorization": "Bearer " + token } },
        { retries: 2, backoffMs: 300 }
      );
      const data = await res.json();
      const completati = (data.ordini || []).filter(o => o.stato === "completato");
      download = completati.flatMap(o => o.prodotti);
    } catch {
      download = [];
    }
  }

  if (!Array.isArray(download) || download.length === 0) {
    container.innerHTML = "<p>Nessun download disponibile.</p>";
    return;
  }

  container.innerHTML = download
    .map(p => {
      const titolo = p.titolo || p.titolo_breve || "Prodotto digitale";
      return `
        <div class="download-box">
          <div><strong>${titolo}</strong></div>
          <a class="btn-download" href="/vendite/download/${p.prodotto_id}">
            Scarica
          </a>
        </div>
      `;
    })
    .join("");
}

// =========================================================
// REFRESH AUTOMATICO
// =========================================================
window.addEventListener("message", async (event) => {
  if (!event.data) return;

  if (
    event.data === "refresh_dashboard" ||
    event.data === "paypal_complete" ||
    event.data === "paypal_cancel"
  ) {
    await updateOrdersUI();
    await updateDownloadsUI();
  }
});

// =========================================================
// PATCH — MODIFICA PROFILO
// =========================================================
document.addEventListener("critical-ready", () => {
  const btnProfilo = document.getElementById("sidebar-nav-profilo");
  const contentProfilo = document.getElementById("content-profilo");

  if (btnProfilo && contentProfilo) {
    btnProfilo.addEventListener("click", () => {
      document.querySelectorAll(".content").forEach(c => c.style.display = "none");
      contentProfilo.style.display = "block";
    });
  }
});
