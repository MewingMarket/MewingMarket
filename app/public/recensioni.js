/* =========================================================
   RECENSIONI — Versione 2027.400
   - critical-ready
   - fetchUniversale (fallback chain)
   - Nessuna regressione
========================================================= */

document.addEventListener("critical-ready", async () => {
  console.log("🔵 [DEBUG] recensioni.js caricato");

  const token = localStorage.getItem("token");
  const listaRecensioni = document.getElementById("listaRecensioni");

  console.log("🔵 [DEBUG] Token:", token);

  if (!token) {
    listaRecensioni.innerHTML = "<p>Devi effettuare il login.</p>";
    return;
  }

  /* =========================================================
     1) CARICA PRODOTTI ACQUISTATI
  ========================================================== */
  const selectProdotto = document.getElementById("selectProdotto");

  async function caricaProdottiAcquistati() {
    console.log("🔵 [DEBUG] Carico prodotti acquistati...");

    try {
      const res = await window.fetchUniversale(
        "/recensioni/prodotti-acquistati",
        {
          headers: { "Authorization": "Bearer " + token }
        }
      );

      const data = await res.json();

      console.log("🟣 [DEBUG] Risposta prodotti-acquistati:", data);

      if (!data.success || data.prodotti.length === 0) {
        selectProdotto.innerHTML = `<option value="">Nessun prodotto acquistato</option>`;
        return;
      }

      selectProdotto.innerHTML = data.prodotti
        .map(p => `<option value="${p.id}">${p.titolo_breve}</option>`)
        .join("");

    } catch (err) {
      console.error("🔴 [DEBUG] Errore caricamento prodotti:", err);
      selectProdotto.innerHTML = `<option value="">Errore caricamento</option>`;
    }
  }

  /* =========================================================
     2) SISTEMA STELLE
  ========================================================== */
  const stars = document.querySelectorAll("#stars span");
  let rating = 0;

  stars.forEach((star, index) => {
    star.addEventListener("click", () => {
      rating = index + 1;

      stars.forEach(s => s.classList.remove("active"));
      for (let i = 0; i < rating; i++) stars[i].classList.add("active");
    });
  });

  /* =========================================================
     3) FILTRO PAROLACCE
  ========================================================== */
  const paroleVietate = [
    "cazzo", "merda", "stronzo", "troia", "puttana", "vaffanculo",
    "bastardo", "cretino", "deficiente", "idiota"
  ];

  function contieneParoleVietate(testo) {
    const lower = testo.toLowerCase();
    return paroleVietate.some(p => lower.includes(p));
  }

  /* =========================================================
     4) INVIO RECENSIONE
  ========================================================== */
  const btnInvia = document.getElementById("btnInvia");
  const commento = document.getElementById("commento");
  const status = document.getElementById("status");

  btnInvia.addEventListener("click", async () => {
    status.textContent = "";
    status.classList.remove("ok", "err");

    const prodotto_id = Number(selectProdotto.value);
    const testo = commento.value.trim();

    if (!prodotto_id) {
      status.textContent = "Seleziona un prodotto.";
      status.classList.add("err");
      return;
    }

    if (rating === 0) {
      status.textContent = "Seleziona un numero di stelle.";
      status.classList.add("err");
      return;
    }

    if (testo.length < 3) {
      status.textContent = "Scrivi un commento più dettagliato.";
      status.classList.add("err");
      return;
    }

    if (contieneParoleVietate(testo)) {
      status.textContent = "Recensione rifiutata: linguaggio non consentito.";
      status.classList.add("err");
      return;
    }

    try {
      const res = await window.fetchUniversale(
        "/recensioni/crea",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + token
          },
          body: JSON.stringify({
            prodotto_id,
            rating,
            commento: testo
          })
        }
      );

      const data = await res.json();

      if (data.success) {
        status.textContent = "Recensione inviata!";
        status.classList.add("ok");

        commento.value = "";
        rating = 0;
        stars.forEach(s => s.classList.remove("active"));

        caricaRecensioni();
      } else {
        status.textContent = data.error || "Errore.";
        status.classList.add("err");
      }

    } catch (err) {
      console.error("🔴 [DEBUG] Errore invio recensione:", err);
      status.textContent = "Errore di connessione.";
      status.classList.add("err");
    }
  });

  /* =========================================================
     5) CARICA RECENSIONI UTENTE
  ========================================================== */
  async function caricaRecensioni() {
    console.log("🔵 [DEBUG] Carico recensioni utente...");

    listaRecensioni.innerHTML = "Caricamento…";

    try {
      const res = await window.fetchUniversale(
        "/recensioni/utente",
        {
          headers: { "Authorization": "Bearer " + token }
        }
      );

      const data = await res.json();

      if (!data.success || data.recensioni.length === 0) {
        listaRecensioni.innerHTML = "<p>Nessuna recensione presente.</p>";
        return;
      }

      listaRecensioni.innerHTML = data.recensioni
        .map(r => `
          <div class="review-item">
            <strong>${r.prodotto_titolo}</strong><br>
            ⭐ ${r.rating}/5<br>
            <em>${new Date(r.data).toLocaleDateString("it-IT")}</em><br><br>
            <p>${r.commento}</p>

            <div class="review-actions">
              <button class="btn-mini btn-edit" data-id="${r.id}">Modifica</button>
              <button class="btn-mini btn-delete" data-id="${r.id}">Elimina</button>
            </div>
          </div>
        `)
        .join("");

      /* ------------------------------
         ELIMINA
      ------------------------------ */
      document.querySelectorAll(".btn-delete").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          if (!confirm("Vuoi davvero eliminare questa recensione?")) return;

          try {
            const res = await window.fetchUniversale(
              "/recensioni/elimina",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + token
                },
                body: JSON.stringify({ id })
              }
            );

            const data = await res.json();

            if (data.success) caricaRecensioni();
            else alert(data.error || "Errore.");

          } catch (err) {
            console.error("🔴 [DEBUG] Errore eliminazione:", err);
            alert("Errore di connessione.");
          }
        });
      });

      /* ------------------------------
         MODIFICA
      ------------------------------ */
      document.querySelectorAll(".btn-edit").forEach(btn => {
        btn.addEventListener("click", async () => {
          const id = btn.dataset.id;

          const nuovoCommento = prompt("Modifica il commento:");
          if (!nuovoCommento || nuovoCommento.trim().length < 5) {
            alert("Commento troppo corto.");
            return;
          }

          const nuovoRating = prompt("Modifica il voto (1-5):");
          const ratingNum = Number(nuovoRating);

          if (!ratingNum || ratingNum < 1 || ratingNum > 5) {
            alert("Voto non valido.");
            return;
          }

          try {
            const res = await window.fetchUniversale(
              "/recensioni/modifica",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": "Bearer " + token
                },
                body: JSON.stringify({
                  id,
                  rating: ratingNum,
                  commento: nuovoCommento.trim()
                })
              }
            );

            const data = await res.json();

            if (data.success) caricaRecensioni();
            else alert(data.error || "Errore.");

          } catch (err) {
            console.error("🔴 [DEBUG] Errore modifica:", err);
            alert("Errore di connessione.");
          }
        });
      });

    } catch (err) {
      console.error("🔴 [DEBUG] Errore caricamento recensioni:", err);
      listaRecensioni.innerHTML = "<p>Errore caricamento recensioni.</p>";
    }
  }

  caricaProdottiAcquistati();
  caricaRecensioni();
});
