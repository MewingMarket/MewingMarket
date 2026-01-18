document.getElementById("unsubscribeForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();

  const res = await fetch("/newsletter/unsubscribe", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (data.status === "ok") {
    alert("Disiscrizione completata.");
  } else {
    alert("Errore durante la disiscrizione.");
  }
});
