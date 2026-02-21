// =========================================================
// Reset password – MewingMarket (BACKEND READY)
// =========================================================

const msg = document.getElementById('status') || document.getElementById('msg');

function setMsg(text, ok = false) {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = ok ? '#4ade80' : '#f97373';
}

document.getElementById('reset-btn')?.addEventListener('click', async () => {
  setMsg("Eliminazione account in corso...");

  const email = localStorage.getItem("utenteEmail");

  if (!email) {
    setMsg("Nessun utente loggato");
    return;
  }

  try {
    const res = await fetch('/api/utente/reset-password', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setMsg("Errore del server");
      return;
    }

    if (data.success) {
      setMsg("Account eliminato. Reindirizzamento...", true);

      localStorage.removeItem("session");
      localStorage.removeItem("utenteEmail");

      setTimeout(() => {
        window.location.href = "cambia-cred.html";
      }, 800);

    } else {
      setMsg(data.error || "Errore durante il reset");
    }

  } catch (err) {
    console.error(err);
    setMsg("Errore di connessione");
  }
});
