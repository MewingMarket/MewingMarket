document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("rimborsoForm");
  const emailInput = document.getElementById("email");
  const ordineSelect = document.getElementById("ordineSelect");
  const motivoInput = document.getElementById("motivo");

  // =========================================================
  // 1) CARICA EMAIL UTENTE + ORDINI COMPLETATI
  // =========================================================
  try {
    const res = await fetch("/api/ordini/utente");
    const data = await res.json();

    if (!data.success) {
      alert("Errore nel caricamento degli ordini.");
      return;
    }

    // Preleva email utente dal backend (sicuro)
    const userRes = await fetch("/api/utente/info");
    const userData = await userRes.json();
    if (userData.success && userData.email) {
      emailInput.value = userData.email;
      emailInput.disabled = true; // L’utente non può modificarla
    }

    const ordini = data.ordini.filter(o => o.stato === "completato");

    ordineSelect.innerHTML = "";

    if (ordini.length === 0) {
      ordineSelect.innerHTML = `<option value="">Nessun ordine completato</option>`;
    } else {
      ordineSelect.innerHTML = `<option value="">Seleziona un ordine</option>`;
      ordini.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = `Ordine #${o.id} — €${o.totale}`;
        ordineSelect.appendChild(opt);
      });
    }

    // =========================================================
    // 2) PRESELEZIONA ORDINE SE ARRIVA ?id=123
    // =========================================================
    const params = new URLSearchParams(window.location.search);
    const preselectId = params.get("id");

    if (preselectId) {
      const exists = ordini.some(o => String(o.id) === String(preselectId));
      if (exists) ordineSelect.value = preselectId;
    }

  } catch (err) {
    console.error("Errore caricamento ordini:", err);
    alert("Errore di connessione.");
  }

  // =========================================================
  // 3) INVIO RICHIESTA RIMBORSO
  // =========================================================
  form.addEventListener("submit", async e => {
    e.preventDefault();

    const ordine_id = ordineSelect.value.trim();
    const motivo = motivoInput.value.trim();

    if (!ordine_id || !motivo) {
      alert("Compila tutti i campi.");
      return;
    }

    try {
      const res = await fetch("/api/rimborso/crea", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ordine_id, motivo })
      });

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore invio richiesta.");
        return;
      }

      alert("Richiesta inviata. Ti risponderemo entro 24–48 ore.");
      form.reset();

    } catch (err) {
      console.error("Errore rimborso:", err);
      alert("Errore di connessione.");
    }
  });
});
