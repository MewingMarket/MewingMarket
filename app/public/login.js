// =========================================================
// Login pubblico – MewingMarket (BACKEND READY)
// =========================================================

const msg = document.getElementById('status') || document.getElementById('msg');

function setMsg(text, ok = false) {
  if (!msg) return;
  msg.textContent = text;
  msg.style.color = ok ? '#4ade80' : '#f97373';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');

  const email = e.target.email.value.trim().toLowerCase();
  const password = e.target.password.value.trim();

  if (!email || !password) {
    setMsg("Inserisci email e password");
    return;
  }

  try {
    const res = await fetch('/api/utente/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json().catch(() => null);

    if (!data) {
      setMsg("Errore del server");
      return;
    }

    if (data.success) {
      localStorage.setItem('session', data.token);
      localStorage.setItem('utenteEmail', email);

      setMsg("Accesso effettuato", true);

      setTimeout(() => {
        window.location.href = "dashboard.html";
      }, 500);

    } else {
      setMsg(data.error || "Credenziali non valide");
    }

  } catch (err) {
    console.error(err);
    setMsg("Errore di connessione");
  }
});
