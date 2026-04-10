/**
 * =========================================================
 * CATALOGO AI — Generatore descrizioni prodotto
 * Versione 2026.900 — Sistema descrizioni unificato
 * - descrizione_lunga = PDF + YouTube → testo di vendita
 * - descrizione_breve = riassunto automatico
 * - RIMOSSA descrizione_email
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluto CORRETTO
const callAI = require(path.join(process.cwd(), "app/server/modules/ai.cjs"));

/* ============================================================
   1) DESCRIZIONE LUNGA (PDF + YouTube → testo di vendita)
============================================================ */
async function generaDescrizioneLunga(prodotto) {
  const { titolo, contenuto = "", youtube_title = "", youtube_description = "" } = prodotto;

  const prompt = `
Genera la descrizione lunga ufficiale per un prodotto digitale del catalogo MewingMarket.

OBIETTIVO:
Una descrizione unica, professionale, chiara, che vende senza sembrare commerciale.

ISTRUZIONI:
- Usa SOLO le informazioni presenti nel PDF e nel contenuto YouTube fornito.
- NON inventare nulla.
- NON aggiungere funzionalità non presenti.
- NON usare tono eccessivamente pubblicitario.
- NON usare frasi generiche da AI.
- NON ripetere concetti.
- NON usare etichette tipo "Titolo:".
- NON superare 1800 caratteri.

STRUTTURA OBBLIGATORIA:
1. Introduzione naturale che integra il titolo, es:
   “La guida ${titolo} è un ebook che…”
2. Cosa contiene il prodotto.
3. A chi serve.
4. Quali problemi risolve.
5. Perché è utile.
6. Come funziona.
7. Cosa otterrà l’utente.
8. Come usarlo.
9. Perché vale la pena acquistarlo.

DATI PDF:
${contenuto}

DATI YOUTUBE (se presenti):
Titolo video: ${youtube_title}
Descrizione video: ${youtube_description}

Scrivi in italiano naturale, fluido, professionale.
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un copywriter professionale specializzato in prodotti digitali.",
    extraData: prodotto
  });
}

/* ============================================================
   2) DESCRIZIONE BREVE (riassunto automatico)
============================================================ */
async function generaDescrizioneBreve(descrizioneLunga) {
  const prompt = `
Riassumi la seguente descrizione in massimo 250 caratteri.
Tono professionale, chiaro, diretto.
Non aggiungere nulla che non sia già presente.
Non usare emoji.
Non iniziare con “In sintesi”.

TESTO:
${descrizioneLunga}
`;

  return await callAI({
    userPrompt: prompt,
    extraSystem: "Sei un assistente che crea riassunti professionali e sintetici."
  });
}

/* ============================================================
   EXPORT
============================================================ */
module.exports = {
  generaDescrizioneLunga,
  generaDescrizioneBreve
};
