// FAQ.js — versione blindata

document.addEventListener("DOMContentLoaded", () => {
  const items = document.querySelectorAll(".faq-item");

  items.forEach(item => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    // Altezza iniziale chiusa
    answer.style.maxHeight = "0px";

    question.addEventListener("click", () => {
      const isOpen = item.classList.contains("open");

      // Chiude tutte le altre
      document.querySelectorAll(".faq-item").forEach(i => {
        i.classList.remove("open");
        i.querySelector(".faq-answer").style.maxHeight = "0px";
      });

      // Se non era aperto, aprilo
      if (!isOpen) {
        item.classList.add("open");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
