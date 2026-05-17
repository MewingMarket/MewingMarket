// =========================================================
// AUTH.JS — Persistenza SQL-SYNC (PATCH 2056)
// Java-mode SAFE: token unico, eventi ordinati, no doppie init
// =========================================================

console.log("🔐 [AUTH 2056] Sistema di autenticazione avviato");

if (window.__AUTH_2056_RUNNING__) {
  console.warn("🔁 [AUTH 2056] Già inizializzato → skip");
} else {
  window.__AUTH_2056_RUNNING__ = true;

  const APP_VERSION = "2056";

  // ============================================================
  // WRAPPER UNIVERSALE
  // ============================================================
  async function apiAuth(path, payload = {}) {
    try {
      const res = await fetch(path, {
        method: "POST",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
          "Authorization": localStorage.getItem("mewing_token")
            ? `Bearer ${localStorage.getItem("mewing_token")}`
            : ""
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      if (!json || !json.success) return null;
      return json.data;

    } catch (err) {
      console.warn("⚠️ [AUTH] Errore rete:", err);
      return null;
    }
  }

  // ============================================================
  // LOG EVENTO
  // ============================================================
  async function logUserEvent(evento) {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await apiAuth("/api/utenti/evento", {
      email,
      evento,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================
  // RESET VERSIONE DEPLOY
  // ============================================================
  (function () {
    const storedVersion = localStorage.getItem("appVersion");

    if (storedVersion !== APP_VERSION) {
      console.warn("[AUTH] Nuova versione → reset sessione");

      localStorage.setItem("logoutReason", "deploy");

      [
        "mewing_token",
        "token",
        "email",
        "ruolo",
        "sessionState",
        "user"
      ].forEach(k => localStorage.removeItem(k));

      window.isLogged = false;
      window.isAdmin = false;

      localStorage.setItem("appVersion", APP_VERSION);
      localStorage.setItem("sessionState", "0");
    }
  })();

  // ============================================================
  // STATO GLOBALE
  // ============================================================
  window.isLogged = false;
  window.isAdmin = false;
  window.userEmail = "";
  window.userData = null;
  window.sessionState = 0;

  // ============================================================
  // CARICA SESSIONE
  // ============================================================
  function loadSession() {
    const token = localStorage.getItem("mewing_token") || "";
    const email = localStorage.getItem("email") || "";
    const ruolo = localStorage.getItem("ruolo") || "";
    const userJson = localStorage.getItem("user");
    const state = parseInt(localStorage.getItem("sessionState") || "0", 10);

    window.isLogged = Boolean(token);
    window.userEmail = email;
    window.isAdmin = (ruolo === "admin" || ruolo === "1");
    window.sessionState = state;

    try {
      window.userData = userJson ? JSON.parse(userJson) : null;
    } catch {
      window.userData = null;
    }

    console.log("[AUTH 2056] Stato:", {
      loggato: window.isLogged,
      admin: window.isAdmin,
      email: window.userEmail
    });
  }

  // ============================================================
  // INIT AUTH (ordinato)
  // ============================================================
  function initAuth() {
    loadSession();

    const reason = localStorage.getItem("logoutReason");
    if (reason === "deploy") {
      logUserEvent("logout_automatico_deploy");
      localStorage.removeItem("logoutReason");
    }

    // Emesso SOLO dopo loadSession
    document.dispatchEvent(new Event("auth-ready"));

    if (window.isLogged) {
      document.dispatchEvent(new Event("user-logged-in"));
    }
  }

  // ============================================================
  // AVVIO ORDINATO
  // ============================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth, { once: true });
  } else {
    initAuth();
  }
}
