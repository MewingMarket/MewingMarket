/* =========================================================
   RECENSIONI UTENTE — Versione 2027.503 SAFE MODE
   - Compatibile cookie di sessione
   - Nessun token nel localStorage
   - fetch() con credentials: "include"
   - Wrapper JSON corretto
   - Logica originale preservata
========================================================= */

console.log("📌 [RECENSIONI 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [RECENSIONI 2058] pageInit() avviata");
  avviaRecensioni();
};

/* =========================================================
   LOGICA RECENSIONI
========================================================= */
async function avviaRecensioni() {
  console.log("🔥 recensioni.js READY");

  const listaRecensioni = document.getElementById("listaRecensioni");
  const selectProdotto = document.getElementById("selectProdotto");
  const btnInvia = document.getElementById("btnInvia");
  const commentoArea = document.getElementById("commento");
  const status = document.getElementById("status");
  const stars = document.querySelectorAll("#stars span");

  let ratingSelezionato = 0;

  /* =========================================================
     1) Verifica login tramite /me
  ========================================================== */
  console.log("🌐 [RECENSIONI] Verifica sessione…");

  const me = await apiRecensioni("/api/utenti/me", { method: "POST" });

  if (!me || me.guest) {
    if (selectProdotto)
      selectProdotto.innerHTML = `<option value="">Effettua il login per recensire</option>`;
    if (btnInvia) btnInvia.disabled = true;
    if (listaRecensioni)
      listaRecensioni.innerHTML = `<p class='info-vuoto'>Effettua il login per vedere le tue recensioni.</p>`;
    return;
  }

  /* =========================================================
     WRAPPER UNIVERSALE (SAFE MODE)
  ========================================================== */
  async function apiRecensioni(path, payload = {}) {
    try {
      const res = await fetch(path, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => null);
      return json || { success: false };

    } catch (err) {
      console.error("❌ [RECENSIONI] Errore rete:", err);
      return { success: false };
    }
  }

  /* =========================================================
     2) CARICA PRODOTTI ACQUISTATI
  ========================================================== */
  async function caricaProdottiAcquistati() {
    const res = await apiRecensioni("/api/recensioni/prodottiAcquistati");

    if (!res.success || !Array.isArray(res.prodotti)) {
      selectProdotto.innerHTML = `<option value="">Nessun prodotto da recensire</option>`;
      btnInvia.disabled = true;
      return;
    }

    selectProdotto.innerHTML = res.prodotti
      .map(p => `<option value="${p.id}">${p.titolo_breve || p.titolo}</option>`)
      .join("");

    btnInvia.disabled = false;
  }

  /* =========================================================
     3) GESTIONE STELLE
  ========================================================== */
  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      ratingSelezionato = index + 1;
      stars.forEach((s, i) => s.classList.toggle("active", i < ratingSelezionato));
    });
  });

  /* =========================================================
     4) INVIO RECENSIONE
  ========================================================== */
  btnInvia.addEventListener("click", async () => {
    const prodotto_id = Number(selectProdotto.value);
    const testo = commentoArea.value.trim();

    if (!prodotto_id || ratingSelezionato === 0 || testo.length < 3) {
      status.textContent = "Compila tutti i campi e seleziona le stelle.";
      status.className = "status-msg err";
      return;
    }

    const res = await apiRecensioni("/api/recensioni/creaRecensione", {
      prodotto_id,
      rating: ratingSelezionato,
      commento: testo
    });

    if (!res.success) {
      status.textContent = res.error || "Errore durante l'invio.";
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
     5) CARICA LISTA RECENSIONI
  ========================================================== */
  async function caricaRecensioni() {
    listaRecensioni.innerHTML = "<div class='loader'>Caricamento...</div>";

    const res = await apiRecensioni("/api/recensioni/recensioniUtente");

    if (!res.success || !Array.isArray(res.recensioni) || res.recensioni.length === 0) {
      listaRecensioni.innerHTML = "<p class='info-vuoto'>Non hai ancora scritto recensioni.</p>";
      return;
    }

    listaRecensioni.innerHTML = res.recensioni
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
     6) FUNZIONI GLOBALI
  ========================================================== */
  window.eliminaRecensione = async (id) => {
    if (!confirm("Vuoi eliminare questa recensione?")) return;

    const res = await apiRecensioni("/api/recensioni/eliminaRecensione", { id });
    if (res.success) caricaRecensioni();
  };

  window.modificaRecensione = async (id) => {
    const nuovoTesto = prompt("Inserisci il nuovo commento:");
    if (!nuovoTesto || nuovoTesto.length < 5) return;

    const res = await apiRecensioni("/api/recensioni/modificaRecensione", {
      id,
      commento: nuovoTesto
    });

    if (res.success) caricaRecensioni();
  };

  /* =========================================================
     7) AVVIO
  ========================================================== */
  caricaProdottiAcquistati();
  caricaRecensioni();
}
