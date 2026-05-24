/* =========================================================
   REGISTER — MewingMarket (PATCH 2027.503 SAFE MODE)
   - Cookie di sessione (no token nel localStorage)
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
========================================================= */

console.log("📌 [REGISTER] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [REGISTER] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [REGISTER] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [REGISTER] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [REGISTER] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [REGISTER] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [REGISTER] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [REGISTER] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [REGISTER] critical-ready già presente → avvio pagina");

  avviaRegistrazione();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO (PATCHATO)
========================================================= */
function avviaRegistrazione() {
  console.log("🔥 register.js READY");

  const form = document.getElementById("register-form");
  const statusBox = document.getElementById("status");

  if (!form) {
    console.warn("❌ [REGISTER] register-form NON trovato");
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect") || "dashboard.html";

  // ⭐ Entrata in flusso sensibile
  localStorage.setItem("sessionState", "2");

  /* =========================================================
     PATCH — Helper per registrare evento utente
  ========================================================== */
  async function logUserEvent(evento) {
    try {
      const email = localStorage.getItem("email") || "";
      if (!email) return;

      console.log("📝 [REGISTER] Log evento:", evento);

      await fetch("/api/utenti/evento", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, evento })
      });

    } catch (err) {
      console.warn("⚠️ [REGISTER] Log evento fallito:", err);
    }
  }

  /* =========================================================
     SUBMIT REGISTRAZIONE
  ========================================================== */
  form.addEventListener("submit", async (e) => {
    console.log("📨 [REGISTER] Submit registrazione");
    e.preventDefault();

    if (!statusBox) return;

    statusBox.style.color = "#d00";
    statusBox.textContent = "Registrazione in corso...";

    const email = form.email.value.trim().toLowerCase();
    const password = form.password.value.trim();
    const confirmPassword = form.confirmPassword.value.trim();
    const codice_fiscale = form.codice_fiscale.value.trim().toUpperCase();

    // VALIDAZIONI BASE
    if (!email || !password || !confirmPassword || !codice_fiscale) {
      statusBox.textContent = "Compila tutti i campi.";
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      statusBox.textContent = "Inserisci un'email valida.";
      return;
    }

    if (password.length < 8) {
      statusBox.textContent = "La password deve contenere almeno 8 caratteri.";
      return;
    }

    if (password !== confirmPassword) {
      statusBox.textContent = "Le password non coincidono.";
      return;
    }

    if (codice_fiscale.length !== 16) {
      statusBox.textContent = "Il codice fiscale deve contenere 16 caratteri.";
      return;
    }

    // Protezione doppio click
    if (form.dataset.lock === "1") {
      console.warn("⛔ [REGISTER] Form lock attivo");
      return;
    }
    form.dataset.lock = "1";

    try {
      console.log("🌐 [REGISTER] Invio registrazione…");

      const res = await fetch("/api/utenti/registrazione", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, codice_fiscale })
      });

      const data = await res.json().catch(() => ({}));
      console.log("📦 [REGISTER] Risposta API:", data);

      if (data.error === "Email gia registrata") {
        statusBox.textContent = "Email già registrata. Effettua il login.";
        statusBox.style.color = "#d00";
        form.dataset.lock = "0";
        return;
      }

      if (!data.success) {
        statusBox.textContent = data.error || "Errore durante la registrazione.";
        form.dataset.lock = "0";
        return;
      }

      /* =====================================================
         SAFE MODE — NON salviamo token/email/ruolo
         La sessione è nei cookie → /me gestisce tutto
      ===================================================== */
      console.log("🔐 [REGISTER] Sessione impostata via cookie (SAFE MODE)");

      // ⭐ PATCH EVENTO: registra registrazione
      logUserEvent("registrato");

      statusBox.style.color = "green";
      statusBox.textContent = "Registrazione completata! Reindirizzamento...";

      console.log("➡️ [REGISTER] Redirect:", redirect);

      setTimeout(() => {
        window.location.href = redirect;
      }, 800);

    } catch (err) {
      console.error("🔥 [REGISTER] Errore di connessione:", err);
      statusBox.textContent = "Errore di connessione.";
    } finally {
      form.dataset.lock = "0";
    }
  });
}
