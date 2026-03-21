// =========================================================
// Eliminazione Account – MewingMarket (VERSIONE DEFINITIVA)
// Compatibile con backend SQL + auth-user
// =========================================================

const msg = document.getElementById("status");
const btnElimina = document.getElementById("reset-btn");

function setMsg(text, ok = false) {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = ok ? "#4ade80" : "#f97373";
}

btnElimina?.addEventListener("click", async () => {
  setMsg("Eliminazione account in corso...");

  // ⭐ PATCH: token corretto
  const sessione = localStorage.getItem("sessione");
  const password = document.getElementById("password")?.value.trim();

  if (!sessione) {
    setMsg("Devi effettuare il login");
    return;
  }

  if (!password) {
    setMsg("Inserisci la tua password per confermare");
    return;
  }

  if (btnElimina.disabled) return;
  btnElimina.disabled = true;

  try {
    const res = await fetch("/api/utenti/elimina-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",

        // ⭐ PATCH: header corretto
        "Authorization": "Bearer " + sessione
      },
      body: JSON.stringify({ password })
    });

    const data = await res.json().catch(() => null);

    if (res.status === 401) {
      setMsg("Sessione scaduta o non valida. Effettua di nuovo il login.");
      return;
    }

    if (!data) {
      setMsg("Errore del server");
      return;
    }

    if (data.success) {
      setMsg("Account eliminato. Reindirizzamento...", true);

      // ⭐ PULIZIA CORRETTA
      localStorage.removeItem("sessione");
      localStorage.removeItem("email");
      localStorage.removeItem("ruolo");

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
