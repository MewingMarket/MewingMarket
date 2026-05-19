/* =========================================================
   NEWSLETTER SUBSCRIBE — UNIVERSAL JSON PATCH 2027.4
   Compatibile con backend 2027.3
========================================================= */

console.log("📌 [SUBSCRIBE] File caricato nel DOM");

/* =========================================================
   AUTORUN
========================================================= */
(function autorun() {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }
  initPage();
})();

/* =========================================================
   INIT PAGE
========================================================= */
function initPage() {
  if (!window.__criticalReady) {
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }
  avviaSubscribe();
}

/* =========================================================
   LOGICA SUBSCRIBE
========================================================= */
function avviaSubscribe() {
  const clean = (t) =>
    typeof t === "string"
      ? t.replace(/</g, "&lt;").replace(/>/g, "&gt;").trim()
      : "";

  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  const form = document.getElementById("subscribeForm");
  const emailInput = document.getElementById("email");

  if (!form || !emailInput) return;

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

    const res = await apiSubscribe("/api/newsletter/subscribe", {
      email
    });

    if (!res.success) {
      alert(res.error || "Errore durante l'iscrizione.");
      sending = false;
      return;
    }

    alert("Iscrizione completata!");
    sending = false;
  });
}

/* =========================================================
   WRAPPER UNIVERSALE
========================================================= */
async function apiSubscribe(path, payload = {}) {
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json().catch(() => null);
    return json || { success: false };

  } catch (err) {
    console.error("❌ [SUBSCRIBE] Errore rete:", err);
    return { success: false, error: "Errore rete" };
  }
}
