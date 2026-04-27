document.addEventListener("critical-ready", async () => {
  const form = document.getElementById("rimborsoForm");
  const emailInput = document.getElementById("email");
  const ordineSelect = document.getElementById("ordineSelect");
  const motivoInput = document.getElementById("motivo");

  const token = localStorage.getItem("token");

  // =========================================================
  // Protezione login
  // =========================================================
  if (!token) {
    alert("Devi effettuare il login per richiedere un rimborso.");
    window.location.href = "/login";
    return;
  }

  async function handleAuth(res) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }
    return res;
  }

  // =========================================================
  // 1) CARICA EMAIL UTENTE + ORDINI COMPLETATI
  // =========================================================
  try {
    // ⭐ PATCH — nuovo endpoint Java‑mode
    const resOrdRaw = await fetch("/api/ordini/getOrdiniUtente", {
      headers: { Authorization: "Bearer " + token }
    });
    const resOrd = await handleAuth(resOrdRaw);
    if (!resOrd) return;

    const data = await resOrd.json();
    if (!data.success) {
      alert("Errore nel caricamento degli ordini.");
      return;
    }

    // ⭐ PATCH — nuovo endpoint Java‑mode
    const resUserRaw = await fetch("/api/utenti/me", {
      headers: { Authorization: "Bearer " + token }
    });
    const resUser = await handleAuth(resUserRaw);
    if (!resUser) return;

    const userData = await resUser.json();
    if (userData.success && userData.utente?.email) {
      emailInput.value = userData.utente.email;
      emailInput.disabled = true;
    }

    // ORDINI COMPLETATI
    const ordini = data.ordini.filter(o => o.stato === "completato");

    ordineSelect.innerHTML = "";

    if (ordini.length === 0) {
      ordineSelect.innerHTML = `<option value="">Nessun ordine completato</option>`;
    } else {
      ordineSelect.innerHTML = `<option value="">Seleziona un ordine</option>`;
      ordini.forEach(o => {
        const opt = document.createElement("option");
        opt.value = o.id;
        opt.textContent = `Ordine #${o.id} — €${(o.totale_cent / 100).toFixed(2)}`;
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
      // ⭐ PATCH — nuovo endpoint Java‑mode
      const resRaw = await fetch("/api/rimborso/creaRichiesta", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ ordine_id, motivo })
      });

      const res = await handleAuth(resRaw);
      if (!res) return;

      const data = await res.json();

      if (!data.success) {
        alert(data.error || "Errore invio richiesta.");
        return;
      }

      // 🔥 RISOLVIBILE
      if (data.message && data.message.includes("risolvibile")) {
        alert(
          "Il problema sembra risolvibile.\n" +
          "Ti abbiamo inviato una email con le istruzioni dettagliate."
        );
        form.reset();
        return;
      }

      // 🔥 NON RISOLVIBILE
      alert("Richiesta inviata. Riceverai una risposta entro poche ore.");
      form.reset();

    } catch (err) {
      console.error("Errore rimborso:", err);
      alert("Errore di connessione.");
    }
  });
});
