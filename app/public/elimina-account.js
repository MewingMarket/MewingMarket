/* =========================================================
   ELIMINAZIONE ACCOUNT — Versione 2027.503 SAFE MODE
   - Compatibile cookie di sessione
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
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
   LOGICA PRINCIPALE
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
     WRAPPER UNIVERSALE (SAFE MODE)
  ========================================================== */
  async function apiDelete(path, options = {}) {
    console.log("🌐 [DELETE-ACCOUNT] API:", path);

    let res;
    try {
      res = await fetch(path, {
        credentials: "include",
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {})
        }
      });
    } catch (err) {
      console.error("❌ [DELETE-ACCOUNT] Errore rete:", err);
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

    return json; // NON json.data
  }

  /* =========================================================
     LOG EVENTO
  ========================================================== */
  async function logUserEvent(evento) {
    console.log("📝 [DELETE-ACCOUNT] Log evento:", evento);

    await apiDelete("/api/utenti/evento", {
      method: "POST",
      body: JSON.stringify({ evento })
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

    const password = document.getElementById("password")?.value.trim();

    if (!password) {
      setMsg("Inserisci la tua password per confermare");
      return;
    }

    localStorage.setItem("sessionState", "2");

    if (btnElimina.disabled) return;
    btnElimina.disabled = true;

    console.log("🔐 [DELETE-ACCOUNT] Invio richiesta eliminaAccount…");

    const res = await apiDelete("/api/utenti/eliminaAccount", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    console.log("📦 [DELETE-ACCOUNT] Risposta eliminaAccount:", res);

    if (!res) {
      setMsg("Errore durante l'eliminazione dell'account");
      btnElimina.disabled = false;
      return;
    }

    setMsg("Account eliminato. Reindirizzamento...", true);

    await logUserEvent("eliminato");

    console.log("🧹 [DELETE-ACCOUNT] Pulizia localStorage…");

    ["email", "ruolo", "user", "sessionState"].forEach(k =>
      localStorage.removeItem(k)
    );
    localStorage.setItem("sessionState", "0");

    setTimeout(() => {
      console.log("➡️ [DELETE-ACCOUNT] Redirect a registrazione.html");
      window.location.href = "registrazione.html";
    }, 1000);

    btnElimina.disabled = false;
  });
}
