/**
 * modules/guides.cjs
 * Guides engine — coerente con guide.html
 */

const { cleanSearchQuery } = require("../utils.js");

const GUIDES = [
  {
    id: "login",
    slug: "login",
    title: "Come accedere al tuo account",
    description: "Istruzioni passo passo per accedere alla tua area personale.",
    keywords: ["login", "accedere", "accesso", "entra", "account"]
  },
  {
    id: "registrazione",
    slug: "registrazione",
    title: "Come creare un account",
    description: "Come registrarti e creare il tuo account MewingMarket.",
    keywords: ["registrazione", "registrarsi", "account nuovo", "iscrizione"]
  },
  {
    id: "download",
    slug: "download",
    title: "Come scaricare un prodotto",
    description: "Cosa fare dopo l’acquisto per scaricare il file.",
    keywords: ["download", "scaricare", "link", "file"]
  },
  {
    id: "ordini",
    slug: "ordini",
    title: "Gestione ordini e annullamenti",
    description: "Come vedere, gestire o annullare i tuoi ordini.",
    keywords: ["ordini", "ordine", "annullare", "annullamento"]
  },
  {
    id: "resi",
    slug: "resi",
    title: "Resi e rimborsi",
    description: "Come funziona la politica di resi e rimborsi.",
    keywords: ["resi", "rimborso", "rimborsi", "soldi indietro"]
  },
  {
    id: "annulla-account",
    slug: "annulla-account",
    title: "Eliminazione account",
    description: "Come richiedere la cancellazione del tuo account.",
    keywords: ["eliminare account", "cancellare account", "privacy", "account"]
  }
];

function scoreMatch(text, item) {
  const t = cleanSearchQuery(text || "");
  if (!t) return 0;

  const hay = [
    item.title || "",
    item.description || "",
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

  for (const item of GUIDES) {
    const s = scoreMatch(text, item);
    if (s > bestScore) {
      bestScore = s;
      best = item;
    }
  }

  return bestScore > 0 ? best : null;
}

function render(item) {
  if (!item) return "Non ho trovato una guida adatta.";

  return `
<div class="mm-card">
  <div class="mm-card-title">${item.title}</div>
  <div class="mm-card-body">
    ${item.description}<br><br>
    <a href="guide.html?topic=${item.slug}" class="mm-btn">Apri guida completa</a>
  </div>
</div>
`;
}

module.exports = {
  search,
  render,
  all: () => GUIDES
};
