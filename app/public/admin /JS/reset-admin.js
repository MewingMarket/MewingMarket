const msg = document.getElementById("msg");

function setMsg(t, ok=false) {
  msg.textContent = t;
  msg.style.color = ok ? "green" : "red";
}

document.getElementById("reset-admin-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  setMsg("Reset in corso...");

  const body = {
    email: e.target.email.value.trim(),
    password: e.target.password.value,
    master: e.target.master.value
  };

  const res = await fetch("/api/admin/reset-password", {
    method: "POST",
    headers: { "Content-Type":"application/json" },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (data.success) {
    setMsg("Password aggiornata!", true);
    e.target.reset();
  } else {
    setMsg(data.error || "Errore reset");
  }
});
