/* =========================================================
   RECENSIONI UTENTE — UNIVERSAL JSON PATCH 2027.970
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

  if (!token) {
    if (selectProdotto)
      selectProdotto.innerHTML = `<option value="">Effettua il login per recensire</option>`;
    if (btnInvia) btnInvia.disabled = true;
    if (listaRecensioni)
      listaRecensioni.innerHTML = `<p class='info-vuoto'>Effettua il login per vedere le tue recensioni.</p>`;
    return;
  }

  /* =========================================================
     WRAPPER UNIVERSALE (token + universal-json)
  ========================================================== */
  async function apiRecensioni(path, options = {}) {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    };

    let res;
    try {
      res = await fetch(path, { ...options, headers });
    } catch (err) {
      console.error("❌ Errore rete:", err);
      return null;
    }

    if (res.status === 401 || res.status === 403) {
      localStorage.removeItem("token");
      window.location.href = "/login";
      return null;
    }

    let json;
    try {
      json = await res.json();
    } catch (e) {
      console.error("❌ Risposta NON JSON da", path);
      return null;
    }

    if (!json.success) {
      console.warn("⚠️ Errore API:", json.error || json.raw);
      return null;
    }

    return json.data;
  }

  /* =========================================================
     1) CARICA PRODOTTI ACQUISTATI
  ========================================================== */
  async function caricaProdottiAcquistati() {
    const data = await apiRecensioni("/api/recensioni/getProdottiAcquistati", {
      method: "GET"
    });

    if (!data || !data.prodotti || data.prodotti.length === 0) {
      selectProdotto.innerHTML = `<option value="">Nessun prodotto da recensire</option>`;
      btnInvia.disabled = true;
      return;
    }

    selectProdotto.innerHTML = data.prodotti
      .map(p => `<option value="${p.id}">${p.titolo_breve || p.titolo}</option>`)
      .join("");

    btnInvia.disabled = false;
  }

  /* =========================================================
     2) GESTIONE STELLE
  ========================================================== */
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      ratingSelezionato = index + 1;
      stars.forEach((s, i) => s.classList.toggle("active", i < ratingSelezionato));
    });
  });

  /* =========================================================
     3) INVIO RECENSIONE
  ========================================================== */
  btnInvia.addEventListener("click", async () => {
    const prodotto_id = Number(selectProdotto.value);
    const testo = commentoArea.value.trim();

    if (!prodotto_id || ratingSelezionato === 0 || testo.length < 3) {
      status.textContent = "Compila tutti i campi e seleziona le stelle.";
      status.className = "status-msg err";
      return;
    }

    const data = await apiRecensioni("/api/recensioni/creaRecensione", {
      method: "POST",
      body: JSON.stringify({
        prodotto_id,
        rating: ratingSelezionato,
        commento: testo
      })
    });

    if (!data) {
      status.textContent = "Errore durante l'invio.";
      status.className = "status-msg err";
      return;
    }

    status.textContent = "Recensione pubblicata con successo!";
    status.className = "status-msg ok";

    commentoArea.value = "";
    ratingSelezionato = 0;
    stars.forEach(s => s.classList.remove("active"));

    caricaRecensioni();
  });

  /* =========================================================
     4) CARICA LISTA RECENSIONI
  ========================================================== */
  async function caricaRecensioni() {
    listaRecensioni.innerHTML = "<div class='loader'>Caricamento i tuoi feedback...</div>";

    const data = await apiRecensioni("/api/recensioni/getRecensioniUtente", {
      method: "GET"
    });

    if (!data || !data.recensioni || data.recensioni.length === 0) {
      listaRecensioni.innerHTML = "<p class='info-vuoto'>Non hai ancora scritto recensioni.</p>";
      return;
    }

    listaRecensioni.innerHTML = data.recensioni
      .map(r => `
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
      `)
      .join("");
  }

  /* =========================================================
     5) FUNZIONI GLOBALI (modifica + elimina)
  ========================================================== */
  window.eliminaRecensione = async (id) => {
    if (!confirm("Vuoi eliminare questa recensione?")) return;

    const data = await apiRecensioni("/api/recensioni/eliminaRecensione", {
      method: "POST",
      body: JSON.stringify({ id })
    });

    if (data) caricaRecensioni();
  };

  window.modificaRecensione = async (id) => {
    const nuovoTesto = prompt("Inserisci il nuovo commento:");
    if (!nuovoTesto || nuovoTesto.length < 5) return;

    const data = await apiRecensioni("/api/recensioni/modificaRecensione", {
      method: "POST",
      body: JSON.stringify({ id, commento: nuovoTesto })
    });

    if (data) caricaRecensioni();
  };

  /* =========================================================
     AVVIO
  ========================================================== */
  caricaProdottiAcquistati();
  caricaRecensioni();
});
