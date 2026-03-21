// =========================================================
// RESET EMAIL REQUEST — Versione DEFINITIVA (2026)
// PUBLIC route — password + token locale
// =========================================================

console.log("[RESET-EMAIL-REQ] Caricato");

const btnResetEmail = document.getElementById("btnResetEmail");
const msgResetEmail = document.getElementById("msgResetEmail");

btnResetEmail?.addEventListener("click", async () => {
  const password = document.getElementById("password")?.value.trim();
  const msg = msgResetEmail;

  if (!msg) return;

  if (!password) {
    msg.textContent = "Inserisci la tua password.";
    msg.className = "err";
    return;
  }

  if (btnResetEmail.disabled) return;
  btnResetEmail.disabled = true;

  try {
    console.log("[RESET-EMAIL-REQ] Invio richiesta…");

    // ⭐ Token locale (NON Authorization)
    const token = localStorage.getItem("token");

    const headers = {
      "Content-Type": "application/json"
    };

    const res = await fetch("/api/utenti/reset-email-request", {
      method: "POST",
      headers,
      body: JSON.stringify({
        password,
        token   // ⭐ PATCH: ora lo inviamo davvero
      })
    });

    const data = await res.json().catch(() => ({}));
    console.log("[RESET-EMAIL-REQ] Risposta:", data);

    if (data.success) {
      msg.textContent = "Email inviata! Controlla la tua casella.";
      msg.className = "ok";
    } else {
      msg.textContent = data.error || "Errore durante la richiesta di reset email.";
      msg.className = "err";
    }

  } catch (err) {
    console.error("[RESET-EMAIL-REQ] Errore:", err);
    msg.textContent = "Errore di connessione.";
    msg.className = "err";
  } finally {
    btnResetEmail.disabled = false;
  }
});
