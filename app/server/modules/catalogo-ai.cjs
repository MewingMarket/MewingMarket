/**
 * =========================================================
 * CATALOGO AI — Generatore descrizioni prodotto
 * Usa il motore AI universale (ai.cjs)
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto
const callAI = require(path.join(process.cwd(), "app/modules/ai.cjs"));

/* ============================================================
   1) DESCRIZIONE LUNGA
============================================================ */
async function generaDescrizioneLunga(prodotto) {
  const prompt = `
Genera una descrizione professionale, chiara e convincente per un prodotto del catalogo MewingMarket.

Regole:
- Non inventare caratteristiche non presenti.
- Non inventare prezzi.
- Non usare tono eccessivamente commerciale.
- Scrivi in italiano naturale.
- Struttura in 2–3 paragrafi brevi.

Dati prodotto:
${JSON.stringify(prodotto, null, 2)}
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un copywriter professionale specializzato in e-commerce.",
    extraData: prodotto
  });
}

/* ============================================================
   2) DESCRIZIONE BREVE
============================================================ */
async function generaDescrizioneBreve(descrizioneLunga) {
  const prompt = `
Riassumi questa descrizione in massimo 140 caratteri, tono neutro e chiaro:

"${descrizioneLunga}"
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un assistente che crea riassunti brevi e chiari."
  });
}

/* ============================================================
   3) DESCRIZIONE EMAIL
============================================================ */
async function generaDescrizioneEmail(descrizioneLunga) {
  const prompt = `
Estrai dalla descrizione seguente un testo breve (max 2 frasi) adatto a una newsletter.

Descrizione:
"${descrizioneLunga}"
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un copywriter email marketing."
  });
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generaDescrizioneLunga,
  generaDescrizioneBreve,
  generaDescrizioneEmail
};
