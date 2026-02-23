/**
 * modules/faq.cjs
 * FAQ engine — versione semplice, coerente con FAQ.html
 */

const { cleanSearchQuery } = require("./utils.js");

const FAQ_ITEMS = [
  {
    id: "acquisto",
    question: "Come funziona l’acquisto?",
    answer: "Tutti i prodotti vengono venduti tramite PayPal, che gestisce pagamento e download.",
    keywords: ["acquisto", "comprare", "pagamento", "pagare", "paypal"]
  },
  {
    id: "rimborso",
    question: "Posso chiedere un rimborso?",
    answer: "Sì, valutiamo ogni richiesta caso per caso. Consulta la pagina “Resi e Rimborsi”.",
    keywords: ["rimborso", "resi", "rimborsi", "soldi indietro"]
  },
  {
    id: "consegna",
    question: "Come ricevo il prodotto?",
    answer: "Dopo il pagamento ricevi subito il link per scaricare il file digitale.",
    keywords: ["ricevo", "download", "link", "consegna", "scaricare"]
  },
  {
    id: "uso-commerciale",
    question: "Posso usare i prodotti commercialmente?",
    answer: "No, tutti i prodotti sono ad uso personale salvo diversa indicazione.",
    keywords: ["commerciale", "licenza", "uso", "diritti"]
  },
  {
    id: "problemi-download",
    question: "Non riesco a scaricare il file",
    answer: "Scrivici a supporto@mewingmarket.it e risolviamo subito.",
    keywords: ["problemi download", "non scarica", "errore download", "file"]
  }
];

function scoreMatch(text, item) {
  const t = cleanSearchQuery(text || "");
  if (!t) return 0;

  const hay = [
    item.question || "",
    item.answer || "",
    ...(item.keywords || [])
  ].join(" ").toLowerCase();

  let score = 0;
  t.split(" ").forEach(w => {
    if (!w || w.length < 3) return;
    if (hay.includes(w)) score += 1;
  });

  return score;
}

function search(text = "") {
  let best = null;
  let bestScore = 0;

  for (const item of FAQ_ITEMS) {
    const s = scoreMatch(text, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  return bestScore > 0 ? best : null;
}

function render(item) {
  if (!item) return "Non ho trovato una FAQ adatta.";

  return `
<div class="mm-card">
  <div class="mm-card-title">${item.question}</div>
  <div class="mm-card-body">
    ${item.answer}
  </div>
</div>
`;
}

module.exports = {
  search,
  render,
  all: () => FAQ_ITEMS
};
