/* =========================================================
   Eliminazione Account — UNIVERSAL JSON PATCH 2027.970
========================================================= */

document.addEventListener("critical-ready", () => {
  const msg = document.getElementById("status");
  const btnElimina = document.getElementById("reset-btn");

  function setMsg(text, ok = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "#4ade80" : "#f97373";
  }

  /* =========================================================
     WRAPPER UNIVERSALE (token + universal-json)
  ========================================================== */
  async function apiDelete(path, options = {}) {
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: token ? `Bearer ${token}` : ""
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
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

  /* =========================================================
     LOG EVENTO (versione sicura)
  ========================================================== */
  async function logUserEvent(evento) {
    const email = localStorage.getItem("email") || "";
    if (!email) return;

    await apiDelete("/api/utenti/evento", {
      method: "POST",
      body: JSON.stringify({ email, evento })
    });
  }

  if (!btnElimina) {
    console.warn("Bottone elimina account non trovato");
    return;
  }

  /* =========================================================
     CLICK ELIMINA ACCOUNT
  ========================================================== */
  btnElimina.addEventListener("click", async () => {
    console.log("🗑️ Click su elimina account");
    setMsg("Eliminazione account in corso...");

    const token = localStorage.getItem("token");
    const password = document.getElementById("password")?.value.trim();

    if (!token) {
      setMsg("Devi effettuare il login");
      return;
    }

    if (!password) {
      setMsg("Inserisci la tua password per confermare");
      return;
    }

    localStorage.setItem("sessionState", "2");

    if (btnElimina.disabled) return;
    btnElimina.disabled = true;

    const data = await apiDelete("/api/utenti/eliminaAccount", {
      method: "POST",
      body: JSON.stringify({ password })
    });

    if (!data) {
      setMsg("Errore durante l'eliminazione dell'account");
      btnElimina.disabled = false;
      return;
    }

    setMsg("Account eliminato. Reindirizzamento...", true);

    await logUserEvent("eliminato");

    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("ruolo");
    localStorage.setItem("sessionState", "0");

    setTimeout(() => {
      window.location.href = "registrazione.html";
    }, 1000);

    btnElimina.disabled = false;
  });
});
