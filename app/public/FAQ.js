/* =========================================================
   FAQ.JS — VERSIONE PREMIUM BLINDATA
   Unifica FAQ standard + FAQ premium
   Aggiunge tracking GA4 + UTM
========================================================= */

let faqStandard = [];
let faqPremium = {};
let utmData = {};

// Carica UTM salvati
try {
  utmData = JSON.parse(localStorage.getItem("mm_utm") || "{}");
} catch {
  utmData = {};
}

/* =========================================================
   TRACKING CLIENT-SIDE
========================================================= */
function trackFAQ(eventName, data = {}) {
  try {
    fetch("/tracking/faq", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: eventName,
        data,
        utm: utmData
      })
    });
  } catch (err) {
    console.warn("Tracking FAQ error:", err);
  }
}/* =========================================================
   CARICAMENTO FAQ STANDARD + PREMIUM
========================================================= */

async function loadFAQ() {
  try {
    const standardRes = await fetch("/data/faq.json");
    faqStandard = await standardRes.json();

    const premiumRes = await fetch("/data/faq-premium.json");
    faqPremium = await premiumRes.json();

    renderFAQ();
  } catch (err) {
    console.error("Errore caricamento FAQ:", err);
  }
}

/* =========================================================
   RENDERING FAQ
========================================================= */

function renderFAQ() {
  const container = document.querySelector(".faq-container");
  if (!container) return;

  container.innerHTML = "";

  // FAQ STANDARD
  faqStandard.forEach(item => {
    container.appendChild(createFAQItem(item.q, item.a, "standard"));
  });

  // FAQ PREMIUM (divise per categoria)
  Object.keys(faqPremium).forEach(category => {
    const catTitle = document.createElement("h2");
    catTitle.textContent = category.replace(/_/g, " ").toUpperCase();
    catTitle.className = "faq-category-title";
    container.appendChild(catTitle);

    faqPremium[category].forEach(item => {
      container.appendChild(createFAQItem(item.q, item.a, category));
    });
  });
  }/* =========================================================
   CREAZIONE ELEMENTO FAQ
========================================================= */

function createFAQItem(question, answer, category) {
  const wrapper = document.createElement("div");
  wrapper.className = "faq-item";

  const q = document.createElement("div");
  q.className = "faq-question";
  q.textContent = question;

  const a = document.createElement("div");
  a.className = "faq-answer";
  a.textContent = answer;

  q.addEventListener("click", () => {
    const isOpen = wrapper.classList.contains("open");
    document.querySelectorAll(".faq-item").forEach(i => i.classList.remove("open"));

    if (!isOpen) {
      wrapper.classList.add("open");

      // Tracking apertura FAQ
      trackFAQ("faq_opened", {
        question,
        category
      });
    }
  });

  wrapper.appendChild(q);
  wrapper.appendChild(a);
  return wrapper;
}

/* =========================================================
   AVVIO
========================================================= */
document.addEventListener("DOMContentLoaded", loadFAQ);
