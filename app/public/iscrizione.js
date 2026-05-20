/* =========================================================
   NEWSLETTER SUBSCRIBE — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [SUBSCRIBE 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [SUBSCRIBE 2058] pageInit() avviata");
  avviaSubscribe();
};

/* =========================================================
   LOGICA SUBSCRIBE (identica)
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
