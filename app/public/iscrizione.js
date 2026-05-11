/* =========================================================
   NEWSLETTER SUBSCRIBE — UNIVERSAL JSON PATCH 2027.970
   PATCH 2050 — AUTORUN + DEBUG ESTESO
========================================================= */

console.log("📌 [SUBSCRIBE] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [SUBSCRIBE] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [SUBSCRIBE] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [SUBSCRIBE] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [SUBSCRIBE] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [SUBSCRIBE] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [SUBSCRIBE] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [SUBSCRIBE] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [SUBSCRIBE] critical-ready già presente → avvio pagina");

  avviaSubscribe();
}

/* =========================================================
   CODICE ORIGINALE INCAPSULATO
========================================================= */
function avviaSubscribe() {
  console.log("🔥 subscribe.js READY");

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function isValidEmail(email) {
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    console.log("🔍 [SUBSCRIBE] Validazione email:", email, "→", ok);
    return ok;
  }

  const form = document.getElementById("subscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ [SUBSCRIBE] Form o input email non trovati");
    return;
  }

  let sending = false;

  form.addEventListener("submit", async (e) => {
    console.log("📨 [SUBSCRIBE] Submit form…");
    e.preventDefault();

    if (sending) {
      console.warn("⏳ [SUBSCRIBE] Submit ignorato: già in invio");
      return;
    }
    sending = true;

    const email = clean(emailInput.value.trim());
    console.log("📭 [SUBSCRIBE] Tentativo iscrizione:", email);

    if (!isValidEmail(email)) {
      alert("Inserisci un'email valida.");
      sending = false;
      return;
    }

    const data = await apiSubscribe("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    console.log("📦 [SUBSCRIBE] Risposta API:", data);

    if (!data) {
      alert("Errore durante l'iscrizione.");
      sending = false;
      return;
    }

    alert("Iscrizione completata!");
    sending = false;
  });
}

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiSubscribe(path, options = {}) {
  console.log("🌐 [SUBSCRIBE] API:", path);

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ [SUBSCRIBE] Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ [SUBSCRIBE] Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ [SUBSCRIBE] Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
