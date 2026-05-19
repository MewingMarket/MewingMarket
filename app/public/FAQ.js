/* =========================================================
   FAQ.js — Versione 2058 (Single Loader Architecture)
   - Nessun autorun
   - Nessun DOMContentLoaded
   - Nessun critical-ready
   - Esegue SOLO quando chiamato da Loader Supremo 2058
========================================================= */

console.log("📌 [FAQ 2058] File caricato");

/* =========================================================
   PAGE INIT — chiamata da Loader Supremo 2058
========================================================= */
window.pageInit = function () {
  console.log("🏁 [FAQ 2058] pageInit() avviata");
  avviaFAQ();
};

/* =========================================================
   MODULO FAQ (logica originale + blindature)
========================================================= */
function avviaFAQ() {
  console.log("🔥 FAQ.js READY");

  const items = document.querySelectorAll(".faq-item");
  if (!items.length) {
    console.warn("⚠️ [FAQ] Nessun .faq-item trovato");
    return;
  }

  items.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    if (!question || !answer) {
      console.warn("⚠️ [FAQ] Struttura FAQ incompleta:", item);
      return;
    }

    // Stato iniziale: chiuso
    answer.style.maxHeight = "0px";
    answer.style.overflow = "hidden";
    answer.style.transition = "max-height 0.35s ease";

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      console.log("👉 [FAQ] Click su domanda:", question.textContent.trim());

      // Chiude tutte le altre FAQ
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("open");
        const a = i.querySelector(".faq-answer");
        if (a) a.style.maxHeight = "0px";
      });

      // Se non era aperta, aprila
      if (!isOpen) {
        item.classList.add("open");

        // Blindatura: scrollHeight può essere 0 se non ancora renderizzato
        const h = answer.scrollHeight;
        const finalHeight = h > 0 ? h : 200;

        console.log("📏 [FAQ] Altezza risposta:", finalHeight);

        answer.style.maxHeight = finalHeight + "px";
      }
    });
  });

  console.log("🟢 [FAQ] Sistema FAQ inizializzato correttamente");
}
