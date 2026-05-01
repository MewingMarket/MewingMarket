/* =========================================================
   DISISCRIZIONE NEWSLETTER — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", () => {
  console.log("✅ disiscrizione.js caricato (CRITICAL READY)");

  const form = document.getElementById("unsubscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ Form o input email non trovati");
    return;
  }

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function safeTrack(event, data = {}) {
    try {
      if (window.trackEvent) window.trackEvent(event, data);
    } catch (err) {
      console.warn("Tracking error:", err);
    }
  }

  safeTrack("newsletter_unsubscribe_page_view");

  let sending = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;

    const email = clean(emailInput.value.trim());
    console.log("📭 Tentativo disiscrizione:", email);

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
});

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiUnsubscribe(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  let res;
  try {
    res = await fetch(path, { ...options, headers });
  } catch (err) {
    console.error("❌ Errore rete:", err);
    return null;
  }

  let json;
  try {
    json = await res.json();
  } catch (e) {
    console.error("❌ Risposta NON JSON da", path);
    return null;
  }

  if (!json.success) {
    console.warn("⚠️ Errore API:", json.error || json.raw);
    return null;
  }

  return json.data;
}
