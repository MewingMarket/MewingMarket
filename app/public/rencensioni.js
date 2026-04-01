/* =========================================================
   File: app/public/recensioni.js
   Dashboard Utente — Le mie recensioni
   Versione definitiva 2026 (PATCH)
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {
  const token = localStorage.getItem("token");
  const email = localStorage.getItem("utenteEmail");

  const selectProdotto = document.getElementById("selectProdotto");
  const stars = document.querySelectorAll("#stars span");
  const comment = document.getElementById("comment");
  const status = document.getElementById("status");
  const listaRecensioni = document.getElementById("listaRecensioni");

  if (!token || !email) {
    status.textContent = "Devi effettuare il login.";
    status.classList.add("err");
    return;
  }

  // ============================
  // 1) CARICA PRODOTTI ACQUISTATI
  // ============================
  let ordini;
  try {
    const res = await fetch("/api/ordini/utente", {
      headers: { "Authorization": "Bearer " + token }
    });
    const data = await res.json();
    ordini = data.ordini || [];
  } catch {
    selectProdotto.innerHTML = `<option>Errore caricamento</option>`;
    return;
  }

  const prodotti = [];
  ordini.forEach(o => {
    if (Array.isArray(o.prodotti)) {
      o.prodotti.forEach(p => prodotti.push(p));
    }
  });

  if (prodotti.length === 0) {
    selectProdotto.innerHTML = `<option>Nessun prodotto acquistato</option>`;
  } else {
    selectProdotto.innerHTML = prodotti
      .map(p => `<option value="${p.slug}" data-title="${p.titolo}">${p.titolo}</option>`)
      .join("");
  }

  // ============================
  // 2) SISTEMA STELLE
  // ============================
  let rating = 0;

  stars.forEach(star => {
    star.addEventListener("click", () => {
      rating = Number(star.dataset.v);

      stars.forEach(s => s.classList.remove("active"));
      for (let i = 0; i < rating; i++) {
        stars[i].classList.add("active");
      }
    });
  });

  // ============================
  // 3) INVIA RECENSIONE
  // ============================
  document.getElementById("sendReview").addEventListener("click", async () => {
    status.textContent = "";
    status.classList.remove("ok", "err");

    const slug = selectProdotto.value;
    const titolo = selectProdotto.selectedOptions[0]?.dataset.title || "";

    if (!slug) {
      status.textContent = "Seleziona un prodotto.";
      status.classList.add("err");
      return;
    }

    if (rating === 0) {
      status.textContent = "Seleziona un numero di stelle.";
      status.classList.add("err");
      return;
    }

    if (comment.value.trim().length < 5) {
      status.textContent = "Scrivi un commento più dettagliato.";
      status.classList.add("err");
      return;
    }

    try {
      const res = await fetch("/api/feedback/crea", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + token
        },
        body: JSON.stringify({
          slug,
          titolo,
          rating,
          commento: comment.value.trim()
        })
      });

      const data = await res.json();

      if (data.success) {
        status.textContent = "Recensione inviata!";
        status.classList.add("ok");
        comment.value = "";
        rating = 0;
        stars.forEach(s => s.classList.remove("active"));
        caricaRecensioni();
      } else {
        status.textContent = data.error || "Errore.";
        status.classList.add("err");
      }

    } catch {
      status.textContent = "Errore di connessione.";
      status.classList.add("err");
    }
  });

  // ============================
  // 4) CARICA RECENSIONI UTENTE
  // ============================
  async function caricaRecensioni() {
    listaRecensioni.innerHTML = "Caricamento…";

    try {
      const res = await fetch("/api/feedback/miei", {
        headers: { "Authorization": "Bearer " + token }
      });
      const data = await res.json();

      if (!data.success || data.feedback.length === 0) {
        listaRecensioni.innerHTML = "Nessuna recensione.";
        return;
      }

      listaRecensioni.innerHTML = data.feedback
        .map(r => `
          <div class="review-item">
            <strong>${r.prodotto_titolo}</strong><br>
            ⭐ ${r.rating}/5<br>
            <em>${new Date(r.data).toLocaleDateString("it-IT")}</em><br><br>
            ${r.commento}
          </div>
        `)
        .join("");

    } catch {
      listaRecensioni.innerHTML = "Errore caricamento recensioni.";
    }
  }

  caricaRecensioni();
});
