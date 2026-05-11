/* =========================================================
   DISISCRIZIONE NEWSLETTER — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [UNSUBSCRIBE] File caricato nel DOM");

// =========================================================
// AUTORUN 2050 — parte SEMPRE, anche se il DOM è riscritto
// =========================================================
(function autorun() {
  console.log("🚀 [UNSUBSCRIBE] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [UNSUBSCRIBE] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [UNSUBSCRIBE] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") {
      initPage();
    } else {
      console.warn("❌ [UNSUBSCRIBE] initPage() NON trovata → JS NON eseguito");
    }
  } catch (e) {
    console.error("🔥 [UNSUBSCRIBE] Errore in initPage():", e);
  }
})();

// =========================================================
// FUNZIONE PRINCIPALE
// =========================================================
function initPage() {
  console.log("🏁 [UNSUBSCRIBE] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [UNSUBSCRIBE] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [UNSUBSCRIBE] critical-ready già presente → avvio pagina");

  avviaDisiscrizione();
}

// =========================================================
// CODICE ORIGINALE INCAPSULATO
// =========================================================
function avviaDisiscrizione() {
  console.log("🔥 disiscrizione.js READY");

  const form = document.getElementById("unsubscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ [UNSUBSCRIBE] Form o input email non trovati");
    return;
  }

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function isValidEmail(email) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    console.log("🔍 [UNSUBSCRIBE] Validazione email:", email, "→", ok);
    return ok;
  }

  function safeTrack(event, data = {}) {
    try {
      console.log("📡 [UNSUBSCRIBE] Tracking:", event, data);
      if (window.trackEvent) window.trackEvent(event, data);
    } catch (err) {
      console.warn("⚠️ Tracking error:", err);
    }
  }

  safeTrack("newsletter_unsubscribe_page_view");

  let sending = false;

  form.addEventListener("submit", async (e) => {
    console.log("📨 [UNSUBSCRIBE] Submit form…");
    e.preventDefault();

    if (sending) {
      console.warn("⏳ [UNSUBSCRIBE] Submit ignorato: già in invio");
      return;
    }
    sending = true;

    const email = clean(emailInput.value.trim());
    console.log("📭 [UNSUBSCRIBE] Tentativo disiscrizione:", email);

    if (!isValidEmail(email)) {
      alert("Inserisci un'email valida.");
      sending = false;
      return;
    }

    safeTrack("newsletter_unsubscribe_attempt", { email });

    const data = await apiUnsubscribe("/api/newsletter/unsubscribe", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    console.log("📦 [UNSUBSCRIBE] Risposta API:", data);

    if (!data) {
      safeTrack("newsletter_unsubscribe_error", { email, reason: "generic" });
      alert("Errore durante la disiscrizione.");
      sending = false;
      return;
    }

    safeTrack("newsletter_unsubscribe_success", { email });
    alert("Disiscrizione completata.");
    sending = false;
  });
}

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiUnsubscribe(path, options = {}) {
  console.log("🌐 [UNSUBSCRIBE] API:", path);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [UNSUBSCRIBE] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [UNSUBSCRIBE] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [UNSUBSCRIBE] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
