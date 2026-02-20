// =========================================================
// File: app/public/reset.js
// Gestione reset password dashboard
// =========================================================

document.getElementById('reset-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  setMsg('');

  const body = {
    email: e.target.email.value.trim(),
    newPassword: e.target.newPassword.value
  };

  const res = await fetch('/api/reset-password', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.success) {
    setMsg('Password aggiornata.', true);
    e.target.reset();
  } else {
    setMsg(data.error || 'Errore reset password');
  }
});
