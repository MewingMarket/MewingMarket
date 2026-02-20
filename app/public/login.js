// =========================================================
// File: app/public/login.js
// Gestione login dashboard
// =========================================================

const msg = document.getElementById('msg');

function setMsg(text, ok = false) {
  msg.textContent = text;
  msg.style.color = ok ? '#4ade80' : '#f97373';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');

  const body = {
    email: e.target.email.value.trim(),
    password: e.target.password.value
  };

  const res = await fetch('/api/login', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.success) {
    localStorage.setItem('session', data.token);
    setMsg('Accesso effettuato...', true);
    window.location.href = '/dashboard.html';
  } else {
    setMsg(data.error || 'Credenziali non valide');
  }
});
