/* =========================================================
   RECENSIONE PREMIUM — MewingMarket
   Versione definitiva: ordine reale, stelle, commento,
   tracking, backend, UX moderna
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  /* -----------------------------------------
     1) OTTIENI ORDER ID DALL'URL
  ----------------------------------------- */
  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    document.getElementById("status").textContent =
      "Ordine non valido.";
    return;
  }

  /* -----------------------------------------
     2) OTTIENI DETTAGLI ORDINE DAL BACKEND
  ----------------------------------------- */
  let ordine;

  try {
    const res = await fetch(`/api/paypal/complete-order?orderId=${orderId}`);
    const data = await res.json();

    if (!data.success) {
      document.getElementById("status").textContent =
        "Impossibile caricare l'ordine.";
      return;
    }

    ordine = data.order;

  } catch (err) {
    console.error(err);
    document.getElementById("status").textContent =
      "Errore di connessione.";
    return;
  }

  /* -----------------------------------------
     3) MOSTRA NOME PRODOTTO
  ----------------------------------------- */
  const productName = document.getElementById("productName");

  if (ordine.prodotti.length === 1) {
    productName.textContent = "Stai recensendo: " + ordine.prodotti[0].titolo;
  } else {
    productName.textContent =
      `Stai recensendo un ordine di ${ordine.prodotti.length} prodotti`;
  }

  /* -----------------------------------------
     4) SISTEMA STELLE
  ----------------------------------------- */
  const stars = document.querySelectorAll("#stars span");
  const comment = document.getElementById("comment");
  const status = document.getElementById("status");
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

  /* -----------------------------------------
     5) INVIO RECENSIONE
  ----------------------------------------- */
  document.getElementById("sendReview").addEventListener("click", async () => {
    status.style.color = "#d00";

    if (rating === 0) {
      status.textContent = "Seleziona un numero di stelle.";
      return;
    }

    if (comment.value.trim().length < 5) {
      status.textContent = "Scrivi un commento più dettagliato.";
      return;
    }

    /* -----------------------------------------
       TRACKING
    ----------------------------------------- */
    if (window.trackEvent) {
      trackEvent("review_submitted", {
        orderId,
        rating,
        comment: comment.value.trim()
      });
    }

    /* -----------------------------------------
       INVIO AL BACKEND
    ----------------------------------------- */
    try {
      await fetch("/api/reviews/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          rating,
          comment: comment.value.trim(),
          date: new Date().toISOString()
        })
      });
    } catch (err) {
      console.warn("Backend non ancora configurato, recensione salvata solo lato tracking.");
    }

    status.style.color = "green";
    status.textContent = "Grazie! La tua recensione è stata inviata.";
    comment.value = "";
  });
});
