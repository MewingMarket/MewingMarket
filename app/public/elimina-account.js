/* =========================================================
   Eliminazione Account – MewingMarket (VERSIONE 2027.900)
   - critical-ready
   - fetch nativo
   - API Java‑mode
========================================================= */

document.addEventListener("critical-ready", () => {
  const msg = document.getElementById("status");
  const btnElimina = document.getElementById("reset-btn");

  /* =========================================================
     PATCH — Helper per registrare evento utente
     (fetch nativo + endpoint Java‑mode)
  ========================================================== */
  async function logUserEvent(evento) {
    try {
      const email = localStorage.getItem("email") || "";
      if (!email) return;

      await fetch("/api/utenti/evento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, evento })
      });

    } catch (err) {
      console.warn("Log evento fallito:", err);
    }
  }

  function setMsg(text, ok = false) {
    if (!msg) return;
    msg.textContent = text;
    msg.style.color = ok ? "#4ade80" : "#f97373";
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

    // Flusso sensibile
    localStorage.setItem("sessionState", "2");

    if (btnElimina.disabled) return;
    btnElimina.disabled = true;

    try {
      // ⭐ PATCH — nuovo endpoint Java‑mode + fetch nativo
      const res = await fetch("/api/utenti/eliminaAccount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json().catch(() => null);

      console.log("Risposta elimina-account:", data);

      if (res.status === 401) {
        setMsg("Sessione scaduta o non valida. Effettua di nuovo il login.");
        return;
      }

      if (!data) {
        setMsg("Errore del server");
        return;
      }

      if (data.error) {
        setMsg(data.error);
        return;
      }

      if (data.success) {
        setMsg("Account eliminato. Reindirizzamento...", true);

        // ⭐ PATCH — registra evento
        await logUserEvent("eliminato");

        // Logout pulito
        localStorage.removeItem("token");
        localStorage.removeItem("email");
        localStorage.removeItem("ruolo");
        localStorage.setItem("sessionState", "0");

        setTimeout(() => {
          window.location.href = "registrazione.html";
        }, 1000);

      } else {
        setMsg(data.error || "Errore durante l'eliminazione dell'account");
      }

    } catch (err) {
      console.error(err);
      setMsg("Errore di connessione");
    } finally {
      btnElimina.disabled = false;
    }
  });
});
