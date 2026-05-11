/* =========================================================
   FAQ.js — PATCH 2050
   Autorun universale + Debug esteso + Toggle blindato
========================================================= */

console.log("📌 [FAQ] File caricato nel DOM");

/* =========================================================
   AUTORUN 2050 — parte SEMPRE
========================================================= */
(function autorun() {
  console.log("🚀 [FAQ] Autorun avviato. DOM state:", document.readyState);

  if (document.readyState === "loading") {
    console.log("⏳ [FAQ] DOM non pronto → attendo DOMContentLoaded");
    document.addEventListener("DOMContentLoaded", autorun, { once: true });
    return;
  }

  console.log("🟢 [FAQ] DOM pronto → avvio initPage()");

  try {
    if (typeof initPage === "function") initPage();
    else console.warn("❌ [FAQ] initPage() NON trovata");
  } catch (e) {
    console.error("🔥 [FAQ] Errore in initPage():", e);
  }
})();

/* =========================================================
   FUNZIONE PRINCIPALE
========================================================= */
function initPage() {
  console.log("🏁 [FAQ] initPage() eseguita");

  if (!window.__criticalReady) {
    console.log("⏳ [FAQ] critical-ready NON ancora emesso → attendo evento");
    document.addEventListener("critical-ready", initPage, { once: true });
    return;
  }

  console.log("🟩 [FAQ] critical-ready già presente → avvio modulo FAQ");

  avviaFAQ();
}

/* =========================================================
   CODICE ORIGINALE + BLINDATURE
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
