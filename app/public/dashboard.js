// =========================================================
// DASHBOARD.JS — Versione RIPRISTINATA (FETCH UNIVERSALE)
// - Ritorniamo al fetchUniversale per risolvere il logout precoce
// - Mantiene il mapping SQL per ordini e download
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

  // Se il sistema ti butta fuori, controlliamo che window.isLogged sia pronto
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
  // 3) Carica dati utente (/me) - USA FETCH UNIVERSALE
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/utenti/me",
      { method: "GET", headers: authHeaders },
      { retries: 3, backoffMs: 500 } // Più aggressivo per evitare il logout d'errore
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
    // Se c'è un errore di rete temporaneo, non buttiamo fuori l'utente subito
    return;
  }

  // -------------------------------------------------------
  // 4) Ordini — USA FETCH UNIVERSALE
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
      logoutAndRedirect();
      return;
    }

    updateOrdersUI(Array.isArray(data.ordini) ? data.ordini : []);

  } catch (err) {
    console.error("[DASHBOARD] Errore ordini:", err);
    updateOrdersUI([]);
  }

  // -------------------------------------------------------
  // 5) Download — USA FETCH UNIVERSALE
  // -------------------------------------------------------
  try {
    const res = await window.fetchUniversale(
      "/download/miei",
      { method: "GET", headers: authHeaders },
      { retries: 2, backoffMs: 300 }
    );

    const data = await res.json().catch(() => ({}));
    console.log("[DASHBOARD] /download/miei:", data);

    updateDownloadsUI(Array.isArray(data.download) ? data.download : []);

  } catch (err) {
    console.error("[DASHBOARD] Errore download:", err);
    updateDownloadsUI([]);
  }
}

// =========================================================
// AGGIORNA UI UTENTE
// =========================================================
function updateUserUI(utente) {
  if (!utente) return;
  const email = utente.email || "";
  const usernameCalc = email ? email.split("@")[0] : "";
  const cf = utente.codice_fiscale || "";

  const elements = ["sidebarEmail", "sidebarUsername", "sidebarCF", "userEmail", "username", "userCF"];
  elements.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      if (id.includes("Email")) el.textContent = email;
      else if (id.includes("CF")) el.textContent = cf;
      else el.textContent = usernameCalc;
    }
  });
}

function logoutAndRedirect() {
  localStorage.removeItem("token");
  localStorage.setItem("sessionState", "0");
  window.location.href = "login.html";
}

// =========================================================
// UPDATE ORDINI (FETCH UNIVERSALE INTERNO)
// =========================================================
async function updateOrdersUI(ordini = null) {
  const token = localStorage.getItem("token");
  const container = document.getElementById("ordersList");
  if (!container) return;

  if (!ordini && token) {
    try {
      const res = await window.fetchUniversale(
        "/ordini/utente",
        { headers: { "Authorization": "Bearer " + token } },
        { retries: 2 }
      );
      const data = await res.json();
      ordini = data.ordini || [];
    } catch { ordini = []; }
  }

  if (!Array.isArray(ordini) || ordini.length === 0) {
    container.innerHTML = "<p>Nessun ordine trovato.</p>";
    return;
  }

  container.innerHTML = ordini.map(o => {
    const totale = (o.totale_cent / 100).toFixed(2);
    return `<div class="ordine-box">
      <strong>Data:</strong> ${new Date(o.data).toLocaleDateString()}<br>
      <strong>Totale:</strong> ${totale}€ — <strong>Stato:</strong> ${o.stato}
    </div>`;
  }).join("");
}

async function updateDownloadsUI(download = null) {
  const container = document.getElementById("downloadsList");
  if (!container) return;
  if (!Array.isArray(download) || download.length === 0) {
    container.innerHTML = "<p>Nessun download disponibile.</p>";
    return;
  }
  container.innerHTML = download.map(p => `
    <div class="download-box">
      <strong>${p.titolo || "Prodotto"}</strong>
      <a class="btn-download" href="/vendite/download/${p.prodotto_id}">Scarica</a>
    </div>`).join("");
}

// Eventi e Profilo rimangono invariati...
window.addEventListener("message", (e) => {
  if (["refresh_dashboard", "paypal_complete"].includes(e.data)) {
    updateOrdersUI();
  }
});

document.addEventListener("critical-ready", () => {
  const btn = document.getElementById("sidebar-nav-profilo");
  const cont = document.getElementById("content-profilo");
  if (btn && cont) {
    btn.onclick = () => {
      document.querySelectorAll(".content").forEach(c => c.style.display = "none");
      cont.style.display = "block";
    };
  }
});
