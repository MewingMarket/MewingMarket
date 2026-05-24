// =========================================================
// AUTH.JS — Persistenza SQL-SYNC (PATCH 2027.503 SAFE MODE)
// Java‑mode SAFE: sessione via cookie, /me pubblico, eventi ordinati
// NIENTE token nel localStorage, stato derivato da /me
// =========================================================

console.log("🔐 [AUTH 2027.503] Sistema di autenticazione avviato");

if (window.__AUTH_2027_RUNNING__) {
  console.warn("🔁 [AUTH] Già inizializzato → skip");
} else {
  window.__AUTH_2027_RUNNING__ = true;

  const APP_VERSION = "2027.503";

  // ============================================================
  // WRAPPER UNIVERSALE API AUTH (cookie-based)
  // ============================================================
  async function apiAuth(path, payload = {}) {
    try {
      const res = await fetch(path, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      return json || { success: false };

    } catch (err) {
      console.warn("⚠️ [AUTH] Errore rete:", err);
      return { success: false };
    }
  }

  // ============================================================
  // LOG EVENTO (compatibile con utenti-evento.cjs)
  // ============================================================
  async function logUserEvent(evento, note = null) {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await apiAuth("/api/utenti/evento", {
      email,
      evento,
      note,
      timestamp: new Date().toISOString()
    });
  }

  // ============================================================
  // RESET VERSIONE DEPLOY
  // ============================================================
  (function () {
    const storedVersion = localStorage.getItem("appVersion");

    if (storedVersion !== APP_VERSION) {
      console.warn("[AUTH] Nuova versione → reset sessione (solo lato client)");

      localStorage.setItem("logoutReason", "deploy");

      [
        "token",
        "mewing_token",
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
  // CARICA SESSIONE DA LOCALSTORAGE (solo cache UI)
  // ============================================================
  function loadSessionFromLocal() {
    const email = localStorage.getItem("email") || "";
    const ruolo = localStorage.getItem("ruolo") || "";
    const userJson = localStorage.getItem("user");
    const state = parseInt(localStorage.getItem("sessionState") || "0", 10);

    window.userEmail = email;
    window.isAdmin = (ruolo === "admin" || ruolo === "1");
    window.sessionState = state;

    try {
      window.userData = userJson ? JSON.parse(userJson) : null;
    } catch {
      window.userData = null;
    }

    // isLogged viene deciso da /me, non dal solo localStorage
    window.isLogged = false;

    console.log("[AUTH 2027.503] Stato iniziale (cache):", {
      loggato: window.isLogged,
      admin: window.isAdmin,
      email: window.userEmail
    });
  }

  // ============================================================
  // INIT AUTH (ordinato, basato su /me)
  // ============================================================
  async function initAuth() {
    loadSessionFromLocal();

    const reason = localStorage.getItem("logoutReason");
    if (reason === "deploy") {
      await logUserEvent("logout_automatico_deploy");
      localStorage.removeItem("logoutReason");
    }

    // 🔥 Recupera /me dal backend (sempre pubblico, cookie-based)
    let me = null;
    try {
      me = await apiAuth("/api/utenti/me");
    } catch {
      me = { success: false };
    }

    if (!me || !me.success) {
      console.warn("⚠️ [AUTH] /me non disponibile o errore server");
      window.isLogged = false;
      window.isAdmin = false;
      window.userEmail = "";
      window.userData = null;
      window.sessionState = 0;

      ["email", "ruolo", "user", "sessionState"].forEach(k =>
        localStorage.removeItem(k)
      );
    } else if (me.guest) {
      // Guest mode
      console.log("[AUTH 2027.503] Utente guest");
      window.isLogged = false;
      window.isAdmin = false;
      window.userEmail = "";
      window.userData = null;
      window.sessionState = 0;

      ["email", "ruolo", "user", "sessionState"].forEach(k =>
        localStorage.removeItem(k)
      );
    } else {
      // Utente loggato
      console.log("[AUTH 2027.503] Utente loggato:", me.utente.email);

      window.isLogged = true;
      window.userEmail = me.utente.email;
      window.isAdmin = (me.utente.ruolo === "admin" || me.utente.ruolo === "1");
      window.userData = me.utente;
      window.sessionState = 1;

      localStorage.setItem("email", me.utente.email);
      localStorage.setItem("ruolo", me.utente.ruolo);
      localStorage.setItem("user", JSON.stringify(me.utente));
      localStorage.setItem("sessionState", "1");
    }

    // Emesso SOLO dopo aver interrogato /me
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
