// FAQ.js — versione blindata e aggiornata

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");

  items.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

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
        a.style.maxHeight = "0px";
      });

      // Se non era aperta, aprila
      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
