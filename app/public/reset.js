// =========================================================
// Reset password pubblico – MewingMarket
// =========================================================

document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');

  const email = e.target.email.value.trim().toLowerCase();
  const newPassword = e.target.newPassword.value.trim();

  // VALIDAZIONI BASE
  if (!email || !newPassword) {
    setMsg("Compila tutti i campi");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    setMsg("Email non valida");
    return;
  }

  if (newPassword.length < 6) {
    setMsg("La password deve contenere almeno 6 caratteri");
    return;
  }

  try {
    const res = await fetch('/api/utente/reset-password', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, newPassword })
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      setMsg("Risposta non valida dal server");
      return;
    }

    if (data.success) {
      setMsg('Password aggiornata con successo', true);
      e.target.reset();
    } else {
      setMsg(data.error || 'Errore reset password');
    }

  } catch (err) {
    console.error(err);
    setMsg("Errore di connessione");
  }
});
