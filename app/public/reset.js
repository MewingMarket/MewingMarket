// =========================================================
// Eliminazione Account – MewingMarket (VERSIONE 2026.10)
// Compatibile con backend SQL + auth.js + sessionState
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

  // =====================================================
  // ⭐ PATCH 2026.10 — Token corretto + sessionState
  // =====================================================
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

  // L’utente è in un flusso sensibile
  localStorage.setItem("sessionState", "2");

  if (btnElimina.disabled) return;
  btnElimina.disabled = true;

  try {
    const res = await fetch("/api/utenti/elimina-account", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // ⭐ Authorization gestito da auth.js, ma qui lo forziamo per sicurezza
        "Authorization": "Bearer " + token
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

    // =====================================================
    // ⭐ Password errata (allineato al backend)
    // =====================================================
    if (data.error === "Password errata") {
      setMsg("Password errata. Riprova.");
      return;
    }

    if (data.success) {
      setMsg("Account eliminato. Reindirizzamento...", true);

      // =====================================================
      // ⭐ PATCH 2026.10 — Logout pulito + sessionState = 0
      // =====================================================
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
