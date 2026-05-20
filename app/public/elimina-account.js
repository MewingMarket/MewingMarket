/* =========================================================
   ELIMINAZIONE ACCOUNT — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [DELETE-ACCOUNT 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [DELETE-ACCOUNT 2058] pageInit() avviata");
  avviaEliminazioneAccount();
};

/* =========================================================
   LOGICA ORIGINALE (identica)
========================================================= */
function avviaEliminazioneAccount() {
  console.log("🔥 eliminazione-account.js READY");

  const msg = document.getElementById("status");
  const btnElimina = document.getElementById("reset-btn");

  function setMsg(text, ok = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "#4ade80" : "#f97373";
    console.log("💬 [DELETE-ACCOUNT] MSG:", text);
  }

  /* =========================================================
     WRAPPER UNIVERSALE
  ========================================================== */
  async function apiDelete(path, options = {}) {
    console.log("🌐 [DELETE-ACCOUNT] API:", path);

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
      console.error("❌ [DELETE-ACCOUNT] Errore rete:", err);
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      console.warn("🔒 [DELETE-ACCOUNT] Token scaduto → redirect login");
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ [DELETE-ACCOUNT] Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ [DELETE-ACCOUNT] Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     LOG EVENTO
  ========================================================== */
  async function logUserEvent(evento) {
    const email = localStorage.getItem("email") || "";
    if (!email) {
      console.warn("⚠️ [DELETE-ACCOUNT] Nessuna email per log evento");
      return;
    }

    console.log("📝 [DELETE-ACCOUNT] Log evento:", evento);

    await apiDelete("/api/utenti/evento", {
      method: "POST",
      body: JSON.stringify({ email, evento })
    });
  }

  if (!btnElimina) {
    console.warn("❌ [DELETE-ACCOUNT] Bottone elimina account NON trovato");
    return;
  }

  /* =========================================================
     CLICK ELIMINA ACCOUNT
  ========================================================== */
  btnElimina.addEventListener("click", async () => {
    console.log("🗑️ [DELETE-ACCOUNT] Click su elimina account");
    setMsg("Eliminazione account in corso...");

    const token = localStorage.getItem("token");
    const password = document.getElementById("password")?.value.trim();

    if (!token) {
      setMsg("Devi effettuare il login");
      return;
    }

    if (!password) {
      setMsg("Inserisci la tua password per confermare");
      return;
    }

    localStorage.setItem("sessionState", "2");

    if (btnElimina.disabled) return;
    btnElimina.disabled = true;

    console.log("🔐 [DELETE-ACCOUNT] Invio richiesta eliminaAccount…");

    const data = await apiDelete("/api/utenti/eliminaAccount", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    console.log("📦 [DELETE-ACCOUNT] Risposta eliminaAccount:", data);

    if (!data) {
      setMsg("Errore durante l'eliminazione dell'account");
      btnElimina.disabled = false;
      return;
    }

    setMsg("Account eliminato. Reindirizzamento...", true);

    await logUserEvent("eliminato");

    console.log("🧹 [DELETE-ACCOUNT] Pulizia localStorage…");

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
    localStorage.setItem("sessionState", "0");

    setTimeout(() => {
      console.log("➡️ [DELETE-ACCOUNT] Redirect a registrazione.html");
      window.location.href = "registrazione.html";
    }, 1000);

    btnElimina.disabled = false;
  });
}
