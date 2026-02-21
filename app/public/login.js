// =========================================================
// Login pubblico MewingMarket
// =========================================================

const msg = document.getElementById('msg');

function setMsg(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? '#4ade80' : '#f97373';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');

  const email = e.target.email.value.trim().toLowerCase();
  const password = e.target.password.value;

  // VALIDAZIONI BASE
  if (!email || !password) {
    setMsg("Inserisci email e password");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    setMsg("Email non valida");
    return;
  }

  try {
    const res = await fetch('/api/utente/login', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ email, password })
    });

    let data = {};
    try {
      data = await res.json();
    } catch {
      setMsg("Risposta non valida dal server");
      return;
    }

    if (data.success) {
      // Salviamo token e email
      localStorage.setItem('session', data.token);
      localStorage.setItem('utenteEmail', email);

      setMsg('Accesso effettuato...', true);

      // Redirect alla dashboard utente
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 500);

    } else {
      setMsg(data.error || 'Credenziali non valide');
    }

  } catch (err) {
    console.error(err);
    setMsg("Errore di connessione");
  }
});
