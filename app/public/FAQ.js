// FAQ.js — versione blindata e aggiornata

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");
  if (!items.length) {
    console.warn("FAQ.js: nessun elemento .faq-item trovato");
    return;
  }

  items.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    if (!question || !answer) {
      console.warn("FAQ.js: struttura FAQ incompleta", item);
      return;
    }

    // Stato iniziale: chiuso
    answer.style.maxHeight = "0px";
    answer.style.overflow = "hidden";
    answer.style.transition = "max-height 0.35s ease";

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Chiude tutte le altre FAQ
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("open");
        const a = i.querySelector(".faq-answer");
        if (a) a.style.maxHeight = "0px";
      });

      // Se non era aperta, aprila
      if (!isOpen) {
        item.classList.add("open");

        // Blindatura: scrollHeight può essere 0 se l'elemento non è ancora renderizzato
        const h = answer.scrollHeight;
        answer.style.maxHeight = (h > 0 ? h : 200) + "px";
      }
    });
  });
});
