/* =========================================================
   NEWSLETTER SUBSCRIBE — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", () => {

  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const form = document.getElementById("subscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) {
    console.error("❌ Form o input email non trovati");
    return;
  }

  let sending = false;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (sending) return;
    sending = true;

    const email = clean(emailInput.value.trim());

    if (!isValidEmail(email)) {
      alert("Inserisci un'email valida.");
      sending = false;
      return;
    }

    const data = await apiSubscribe("/api/newsletter/subscribe", {
      method: "POST",
      body: JSON.stringify({ email })
    });

    if (!data) {
      alert("Errore durante l'iscrizione.");
      sending = false;
      return;
    }

    alert("Iscrizione completata!");
    sending = false;
  });
});

/* =========================================================
   WRAPPER UNIVERSALE (universal-json)
========================================================= */
async function apiSubscribe(path, options = {}) {
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
