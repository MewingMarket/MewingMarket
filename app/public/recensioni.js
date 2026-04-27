/* =========================================================
   RECENSIONI UTENTE — Versione SQL Definitiva 2027.990
   Mapping: feedback.prodotto_id -> prodotti.id
   PATCH: Token + Gestione 401/403 + Coerenza auth-user
========================================================= */

document.addEventListener("critical-ready", async () => {
  console.log("🔵 [RECENSIONI] Init sistema feedback...");

  const listaRecensioni = document.getElementById("listaRecensioni");
  const selectProdotto = document.getElementById("selectProdotto");
  const btnInvia = document.getElementById("btnInvia");
  const commentoArea = document.getElementById("commento");
  const status = document.getElementById("status");
  const stars = document.querySelectorAll("#stars span");

  const token = localStorage.getItem("token");
  let ratingSelezionato = 0;

  // Protezione base: se non c'è token, blocco UI
  if (!token) {
    if (selectProdotto) {
      selectProdotto.innerHTML = `<option value="">Effettua il login per recensire</option>`;
    }
    if (btnInvia) btnInvia.disabled = true;
    if (listaRecensioni) {
      listaRecensioni.innerHTML = `<p class='info-vuoto'>Effettua il login per vedere le tue recensioni.</p>`;
    }
    return;
  }

  async function handleAuthResponse(res) {
    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }
    return res;
  }

  // 1) CARICA PRODOTTI ACQUISTATI (per la select)
  async function caricaProdottiAcquistati() {
    try {
      const resRaw = await fetch("/api/recensioni/prodotti-acquistati", {
        headers: { Authorization: "Bearer " + token }
      });
      const res = await handleAuthResponse(resRaw);
      if (!res) return;

      const data = await res.json();

      if (!data.success || !data.prodotti || data.prodotti.length === 0) {
        selectProdotto.innerHTML = `<option value="">Nessun prodotto da recensire</option>`;
        btnInvia.disabled = true;
        return;
      }

      selectProdotto.innerHTML = data.prodotti
        .map(p => `<option value="${p.id}">${p.titolo_breve || p.titolo}</option>`)
        .join("");

      btnInvia.disabled = false;
    } catch (err) {
      console.error("🔴 [RECENSIONI] Errore prodotti acquistati:", err);
      selectProdotto.innerHTML = `<option value="">Errore caricamento prodotti</option>`;
    }
  }

  // 2) GESTIONE STELLE (UI)
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      ratingSelezionato = index + 1;
      stars.forEach((s, i) => {
        s.classList.toggle("active", i < ratingSelezionato);
      });
    });
  });

  // 3) INVIO RECENSIONE
  btnInvia.addEventListener("click", async () => {
    const prodotto_id = Number(selectProdotto.value);
    const testo = commentoArea.value.trim();

    if (!prodotto_id || ratingSelezionato === 0 || testo.length < 3) {
      status.textContent = "Compila tutti i campi e seleziona le stelle.";
      status.className = "status-msg err";
      return;
    }

    try {
      const resRaw = await fetch("/api/recensioni/crea", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({
          prodotto_id,
          rating: ratingSelezionato,
          commento: testo
        })
      });
      const res = await handleAuthResponse(resRaw);
      if (!res) return;

      const data = await res.json();

      if (data.success) {
        status.textContent = "Recensione pubblicata con successo!";
        status.className = "status-msg ok";
        commentoArea.value = "";
        ratingSelezionato = 0;
        stars.forEach(s => s.classList.remove("active"));
        caricaRecensioni();
      } else {
        status.textContent = data.error || "Errore durante l'invio.";
        status.className = "status-msg err";
      }
    } catch (err) {
      status.textContent = "Errore di connessione al database.";
      status.className = "status-msg err";
    }
  });

  // 4) CARICA LISTA RECENSIONI
  async function caricaRecensioni() {
    listaRecensioni.innerHTML = "<div class='loader'>Caricamento i tuoi feedback...</div>";

    try {
      const resRaw = await fetch("/api/recensioni/utente", {
        headers: { Authorization: "Bearer " + token }
      });
      const res = await handleAuthResponse(resRaw);
      if (!res) return;

      const data = await res.json();

      if (!data.success || !data.recensioni || data.recensioni.length === 0) {
        listaRecensioni.innerHTML = "<p class='info-vuoto'>Non hai ancora scritto recensioni.</p>";
        return;
      }

      listaRecensioni.innerHTML = data.recensioni.map(r => `
        <div class="review-card">
          <div class="review-header">
            <strong>${r.prodotto_titolo || "Prodotto"}</strong>
            <span class="stars">${"★".repeat(r.rating)}${"☆".repeat(5 - r.rating)}</span>
          </div>
          <p class="review-body">${r.commento}</p>
          <div class="review-footer">
            <small>${new Date(r.data).toLocaleDateString("it-IT")}</small>
            <div class="review-actions">
              <button class="btn-edit" onclick="modificaRecensione(${r.id})">Modifica</button>
              <button class="btn-delete" onclick="eliminaRecensione(${r.id})">Elimina</button>
            </div>
          </div>
        </div>
      `).join("");

    } catch (err) {
      listaRecensioni.innerHTML = "<p>Errore nel recupero delle recensioni.</p>";
    }
  }

  // 5) FUNZIONI GLOBALI
  window.eliminaRecensione = async (id) => {
    if (!confirm("Vuoi eliminare questa recensione?")) return;
    try {
      const resRaw = await fetch("/api/recensioni/elimina", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ id })
      });
      const res = await handleAuthResponse(resRaw);
      if (!res) return;

      const data = await res.json();
      if (data.success) caricaRecensioni();
    } catch (e) {
      alert("Errore eliminazione.");
    }
  };

  window.modificaRecensione = async (id) => {
    const nuovoTesto = prompt("Inserisci il nuovo commento:");
    if (!nuovoTesto || nuovoTesto.length < 5) return;

    try {
      const resRaw = await fetch("/api/recensioni/modifica", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token
        },
        body: JSON.stringify({ id, commento: nuovoTesto })
      });
      const res = await handleAuthResponse(resRaw);
      if (!res) return;

      const data = await res.json();
      if (data.success) caricaRecensioni();
    } catch (e) {
      alert("Errore modifica.");
    }
  };

  // Avvio
  caricaProdottiAcquistati();
  caricaRecensioni();
});
