/**
 * =========================================================
 * RIMBORSO — Categorie + Risposte Base
 * Versione 2026.995 — Motore categorie rimborsi
 * - Nessuna invenzione
 * - Nessuna AI
 * - Risposte basate su logica assistenza
 * =========================================================
 */

module.exports = [
  {
    categoria: "download",
    tipo: "risolvibile",
    keywords: [
      "download",
      "scaricare",
      "file",
      "errore",
      "non si apre",
      "link",
      "non funziona il download"
    ],
    risposta_base: `
Per risolvere i problemi di download puoi:

1. Provare da un altro browser (Chrome, Safari, Firefox).
2. Provare da un altro dispositivo (telefono / PC).
3. Disattivare estensioni che bloccano i download.
4. Assicurarti che la connessione sia stabile.

Se il problema persiste, rispondi a questa email e ti assisteremo direttamente.
`
  },

  {
    categoria: "contenuto_mancante",
    tipo: "risolvibile",
    keywords: [
      "manca",
      "non trovo",
      "contenuto",
      "non vedo",
      "non appare",
      "non è presente"
    ],
    risposta_base: `
Il contenuto è disponibile nella sezione "I miei download" del tuo account.

Se non lo visualizzi:
1. Effettua il logout e rientra.
2. Controlla la cartella spam per eventuali email di consegna.
3. Verifica di aver acquistato con la stessa email.

Se il problema persiste, rispondi a questa email.
`
  },

  {
    categoria: "pagamento",
    tipo: "risolvibile",
    keywords: [
      "paypal",
      "pagamento",
      "transazione",
      "carta",
      "non ho pagato",
      "non vedo il pagamento"
    ],
    risposta_base: `
Per verificare il pagamento:

1. Controlla l'email di conferma PayPal.
2. Controlla l'estratto conto della carta.
3. Se la transazione risulta "in sospeso", verrà completata o annullata automaticamente.

Se hai dubbi, rispondi a questa email.
`
  },

  {
    categoria: "qualita",
    tipo: "non_risolvibile",
    keywords: [
      "qualità",
      "non mi piace",
      "scarso",
      "deluso",
      "non soddisfa"
    ],
    risposta_base: `
La tua richiesta richiede una verifica manuale da parte del nostro team.
`
  },

  {
    categoria: "altro",
    tipo: "non_risolvibile",
    keywords: [],
    risposta_base: `
La tua richiesta richiede una verifica manuale. Ti risponderemo entro 24/48 ore.
`
  }
];
