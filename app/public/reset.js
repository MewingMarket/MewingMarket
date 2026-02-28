// =========================================================
// Eliminazione Account – MewingMarket (VERSIONE DEFINITIVA)
// =========================================================

const msg = document.getElementById('status');

function setMsg(text, ok = false) {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = ok ? '#4ade80' : '#f97373';
}

document.getElementById('reset-btn')?.addEventListener('click', async () => {
  setMsg("Eliminazione account in corso...");

  // TOKEN CORRETTO
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

  try {
    const res = await fetch('/api/utenti/elimina-account', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-token': token
      },
      body: JSON.stringify({ token, password })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setMsg("Errore del server");
      return;
    }

    if (data.success) {
      setMsg("Account eliminato. Reindirizzamento...", true);

      // Pulizia locale
      localStorage.removeItem("token");
      localStorage.removeItem("utenteEmail");

      // Aggiorna footer dinamico se presente
      if (typeof aggiornaFooterUtente === "function") {
        aggiornaFooterUtente();
      }

      setTimeout(() => {
        window.location.href = "registrazione.html";
      }, 1000);

    } else {
      setMsg(data.error || "Errore durante l'eliminazione dell'account");
    }

  } catch (err) {
    console.error(err);
    setMsg("Errore di connessione");
  }
});
