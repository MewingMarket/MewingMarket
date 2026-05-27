// =========================================================
// AUTH.JS — Versione 2027.504 ULTRA-SAFE
// - Nessun errore sincrono
// - Nessun blocco del GLOBAL
// - /me totalmente non-bloccante
// =========================================================

console.log("🔐 [AUTH 2027.504] Sistema di autenticazione avviato");

if (window.__AUTH_2027_RUNNING__) {
  console.warn("🔁 [AUTH] Già inizializzato → skip");
} else {
  window.__AUTH_2027_RUNNING__ = true;

  const APP_VERSION = "2027.504";

  async function apiAuth(path, payload = {}) {
    try {
      const res = await fetch(path, {
        method: "POST",
        cache: "no-store",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      return json || { success: false };

    } catch (err) {
      console.warn("⚠️ [AUTH] Errore rete:", err);
      return { success: false };
    }
  }

  // Stato globale safe
  window.isLogged = false;
  window.isAdmin = false;
  window.userEmail = "";
  window.userData = null;
  window.sessionState = 0;

  function loadSessionFromLocal() {
    try {
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

      window.isLogged = false;

    } catch (e) {
      console.warn("⚠️ [AUTH] Errore loadSession:", e);
    }
  }

  async function initAuth() {
    try {
      loadSessionFromLocal();

      let me = await apiAuth("/api/utenti/me");

      if (!me || !me.success || me.guest) {
        console.warn("⚠️ [AUTH] /me non disponibile → modalità guest");

        window.isLogged = false;
        window.isAdmin = false;
        window.userEmail = "";
        window.userData = null;
        window.sessionState = 0;

        ["email", "ruolo", "user", "sessionState"].forEach(k => {
          try { localStorage.removeItem(k); } catch {}
        });

      } else {
        window.isLogged = true;
        window.userEmail = me.utente.email;
        window.isAdmin = (me.utente.ruolo === "admin" || me.utente.ruolo === "1");
        window.userData = me.utente;
        window.sessionState = 1;

        try {
          localStorage.setItem("email", me.utente.email);
          localStorage.setItem("ruolo", me.utente.ruolo);
          localStorage.setItem("user", JSON.stringify(me.utente));
          localStorage.setItem("sessionState", "1");
        } catch {}
      }

      document.dispatchEvent(new Event("auth-ready"));
      if (window.isLogged) document.dispatchEvent(new Event("user-logged-in"));

    } catch (e) {
      console.warn("⚠️ [AUTH] Errore initAuth:", e);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAuth, { once: true });
  } else {
    initAuth();
  }
}
