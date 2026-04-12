/**
 * =========================================================
 * EMAIL — Rimborso intelligente (premium + categorie)
 * Versione 2026.995 — Unificato + Template Premium
 * =========================================================
 */

const path = require("path");

const { inviaEmailLista } = require(path.join(
  process.cwd(),
  "app/server/modules/invia-email-lista.cjs"
));

const { SENDER_VENDITE } = require(path.join(
  process.cwd(),
  "app/server/modules/email-senders.cjs"
));

// Nuovi moduli autorizzati
const categorieRimborso = require(path.join(
  process.cwd(),
  "app/server/modules/rimborso-categorie.cjs"
));

const { generaRispostaRimborso } = require(path.join(
  process.cwd(),
  "app/server/modules/genera-risposta-rimborso.cjs"
));

// Template premium (già esistente)
const { templateEmailRisposta } = require(path.join(
  process.cwd(),
  "app/server/modules/email-risposta.cjs"
));

/* ============================================================
   GENERA EMAIL (risolvibile / non_risolvibile / rifiutato / approvato)
============================================================ */
async function inviaEmailRimborso({ email, tipo, motivo, categoriaRecord }) {
  let rispostaAI = "";

  // ============================================================
  // 1) RISOLVIBILE → risposta categoria
  // ============================================================
  if (tipo === "risolvibile") {
    rispostaAI = await generaRispostaRimborso({
      motivo,
      categoriaRecord
    });

    const html = templateEmailRisposta({ rispostaAI });

    return await inviaEmailLista({
      email,
      listId: 12,
      subject: "Aggiornamento sulla tua richiesta",
      html,
      sender: SENDER_VENDITE,
      tipo: "rimborso",
      modalita: "normale"
    });
  }

  // ============================================================
  // 2) NON RISOLVIBILE → presa in carico
  // ============================================================
  if (tipo === "non_risolvibile") {
    rispostaAI = `
Ciao,  
abbiamo ricevuto la tua richiesta di rimborso.  
Il nostro team la sta valutando e riceverai un aggiornamento entro poche ore.
`;

    const html = templateEmailRisposta({ rispostaAI });

    return await inviaEmailLista({
      email,
      listId: 12,
      subject: "Richiesta di rimborso ricevuta",
      html,
      sender: SENDER_VENDITE,
      tipo: "rimborso",
      modalita: "normale"
    });
  }

  // ============================================================
  // 3) RIFIUTATO (admin) → risposta categoria
  // ============================================================
  if (tipo === "rifiutato") {
    rispostaAI = await generaRispostaRimborso({
      motivo,
      categoriaRecord
    });

    const html = templateEmailRisposta({ rispostaAI });

    return await inviaEmailLista({
      email,
      listId: 12,
      subject: "Aggiornamento sulla tua richiesta",
      html,
      sender: SENDER_VENDITE,
      tipo: "rimborso",
      modalita: "normale"
    });
  }

  // ============================================================
  // 4) APPROVATO (admin)
  // ============================================================
  if (tipo === "approvato") {
    rispostaAI = `
Ciao,  
ti confermiamo che il tuo rimborso è stato approvato.  
L'importo verrà riaccreditato automaticamente sul metodo di pagamento utilizzato.
`;

    const html = templateEmailRisposta({ rispostaAI });

    return await inviaEmailLista({
      email,
      listId: 12,
      subject: "Rimborso approvato",
      html,
      sender: SENDER_VENDITE,
      tipo: "rimborso",
      modalita: "normale"
    });
  }
}

module.exports = {
  inviaEmailRimborso
};
