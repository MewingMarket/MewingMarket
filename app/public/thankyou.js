/* =========================================================
   FILE: /public/thankyou.js
   THANK YOU PAGE — MewingMarket
   Versione SQL READY + PayPal + Download sicuro
   PATCH 2026 — Flusso recensioni post-acquisto + Moderazione
========================================================= */

document.addEventListener("DOMContentLoaded", async () => {

  const url = new URL(window.location.href);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    window.location.href = "catalogo.html";
    return;
  }

  let ordine;

  /* =========================================================
     1) VERIFICA ORDINE (complete-order)
  ========================================================== */
  try {
    const res = await fetch(`/api/paypal/complete-order?orderId=${orderId}`);
    const data = await res.json();

    if (!data.success) {
      document.querySelector(".box").innerHTML = `
        <h1>Ordine non valido</h1>
        <p>${data.error || "Impossibile verificare l'ordine."}</p>
        <a href="catalogo.html" class="btn btn-home">Torna al catalogo</a>
      `;
      return;
    }

    ordine = data.order;

  } catch (err) {
    console.error(err);
    document.querySelector(".box").innerHTML = `
      <h1>Errore</h1>
      <p>Impossibile verificare l'ordine.</p>
      <a href="catalogo.html" class="btn btn-home">Torna al catalogo</a>
    `;
    return;
  }

  /* =========================================================
     2) RENDER RIEPILOGO (SQL READY)
  ========================================================== */
  const prodEl = document.getElementById("prod");
  const priceEl = document.getElementById("price");
  const dateEl = document.getElementById("date");

  if (ordine.prodotti.length === 1) {
    const p = ordine.prodotti[0];
    const prezzo = (p.prezzo_cent / 100) * (p.qty || 1);
    prodEl.textContent = p.titolo;
    priceEl.textContent = prezzo.toFixed(2);
  } else {
    prodEl.textContent = `${ordine.prodotti.length} prodotti`;
    priceEl.textContent = (ordine.totale_cent / 100).toFixed(2);
  }

  // Lista prodotti
  const listEl = document.getElementById("prod-list");
  listEl.innerHTML = ordine.prodotti
    .map(p => {
      const prezzo = (p.prezzo_cent / 100) * (p.qty || 1);
      return `<li>${p.titolo} — ${prezzo.toFixed(2)}€</li>`;
    })
    .join("");

  dateEl.textContent = new Date().toLocaleDateString("it-IT");

  /* =========================================================
     3) DOWNLOAD (ID-based + token)
  ========================================================== */
  const dlBox = document.getElementById("download-box");
  const session = localStorage.getItem("session");

  if (ordine.stato === "completato") {
    dlBox.innerHTML = ordine.prodotti
      .map(p => `
        <a class="btn-download" 
           href="/api/vendite/download/${p.prodotto_id}?session=${session}">
          Scarica ${p.titolo}
        </a>
      `)
      .join("<br>");
  } else {
    dlBox.innerHTML = `<p>L'ordine non risulta completato.</p>`;
  }

  /* =========================================================
     4) SVUOTA CARRELLO + BADGE
  ========================================================== */
  Cart.clear();
  if (typeof aggiornaBadgeCarrello === "function") aggiornaBadgeCarrello();

  /* =========================================================
     5) PATCH RECENSIONI — Form integrato
  ========================================================== */

  const fbBtn = document.getElementById("feedbackBtn");
  const fbForm = document.getElementById("feedbackForm");
  const selectProdotto = document.getElementById("selectProdotto");
  const stars = document.querySelectorAll("#stars span");
  const comment = document.getElementById("comment");
  const status = document.getElementById("status");

  const token = localStorage.getItem("token");
  const email = localStorage.getItem("utenteEmail");

  if (fbBtn && ordine.prodotti.length > 0) {
    fbBtn.style.display = "inline-block";

    fbBtn.addEventListener("click", () => {
      fbForm.style.display = "block";

      // Carica prodotti nel select
      selectProdotto.innerHTML = ordine.prodotti
        .map(p => `<option value="${p.prodotto_id}" data-title="${p.titolo}">${p.titolo}</option>`)
        .join("");
    });
  }

  /* =========================================================
     5B) SISTEMA STELLE
  ========================================================== */
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

  /* =========================================================
     PATCH 2026 — FILTRO RECENSIONI + BAN AUTOMATICO
  ========================================================== */

  const paroleVietate = [
    "cazzo", "merda", "stronzo", "troia", "puttana", "vaffanculo",
    "bastardo", "cretino", "deficiente", "idiota",
    "bestemmia1", "bestemmia2", "bestemmia3",
    "sei un fallito", "sei un truffatore", "sei un ladro",
    "muori", "ti odio", "pezzo di",
    "vergognati", "fai schifo", "ridicolo"
  ];

  function contieneParoleVietate(testo) {
    const lower = testo.toLowerCase();
    return paroleVietate.some(p => lower.includes(p));
  }

  function recensioneOffTopic(testo) {
    const paroleProdotto = [
      "prodotto", "qualità", "download", "file",
      "audio", "video", "esercizi", "contenuto"
    ];
    const lower = testo.toLowerCase();
    return !paroleProdotto.some(p => lower.includes(p));
  }

  async function bannaUtente(motivo) {
    try {
      await fetch("/api/utenti/ban", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ motivo })
      });
    } catch (err) {
      console.error("Errore ban utente:", err);
    }
  }

  /* =========================================================
     5C) INVIO RECENSIONE (PATCHATO)
  ========================================================== */
  const sendReview = document.getElementById("sendReview");

  if (sendReview) {
    sendReview.addEventListener("click", async () => {
      status.textContent = "";
      status.classList.remove("ok", "err");

      const prodotto_id = selectProdotto.value;
      const titolo = selectProdotto.selectedOptions[0]?.dataset.title || "";
      const testo = comment.value.trim();

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

      if (testo.length < 5) {
        status.textContent = "Scrivi un commento più dettagliato.";
        status.classList.add("err");
        return;
      }

      // 🔥 FILTRO PAROLACCE / INSULTI / BESTEMMIE
      if (contieneParoleVietate(testo)) {
        status.textContent = "Recensione rifiutata: linguaggio non consentito.";
        status.classList.add("err");
        await bannaUtente("linguaggio offensivo");
        return;
      }

      // 🔥 FILTRO OFF-TOPIC
      if (recensioneOffTopic(testo)) {
        status.textContent = "Recensione rifiutata: deve riguardare il prodotto acquistato.";
        status.classList.add("err");
        await bannaUtente("recensione impropria/off-topic");
        return;
      }

      // 🔥 INVIO RECENSIONE (solo se tutto ok)
      try {
        const res = await fetch("/api/recensioni/crea", {
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
        });

        const data = await res.json();

        if (data.success) {
          status.textContent = "Recensione inviata!";
          status.classList.add("ok");
          comment.value = "";
          rating = 0;
          stars.forEach(s => s.classList.remove("active"));
        } else {
          status.textContent = data.error || "Errore.";
          status.classList.add("err");
        }

      } catch {
        status.textContent = "Errore di connessione.";
        status.classList.add("err");
      }
    });
  }

  /* =========================================================
     6) TRACKING EVENTO
  ========================================================== */
  if (window.trackEvent) {
    trackEvent("order_completed", {
      orderId,
      totale: ordine.totale_cent / 100,
      prodotti: ordine.prodotti.length
    });
  }
});
