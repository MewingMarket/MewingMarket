/**
 * =========================================================
 * File: app/modules/email-automatiche.cjs
 * SCOPO: Invio email automatiche interne (KPI, report, alert)
 * FUTURE-PROOF — Nessuna logica invasiva
 * =========================================================
 */

const path = require("path");

// Percorsi assoluti corretti (struttura reale)
const { inviaEmailLista } = require(
  path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs")
);

const { SENDER_NEWSLETTER } = require(
  path.join(process.cwd(), "app/server/modules/email-senders.cjs")
);

/**
 * Invio email automatica interna
 * @param {Object} param0
 * @param {string} param0.to - Destinatario
 * @param {string} param0.template - Nome template (report_giornaliero, ecc.)
 * @param {Object} param0.dati - Payload dati KPI
 */
async function inviaEmailAutomatica({ to, template, dati }) {
  try {
    console.log(`[EMAIL-AUTO] Invio template: ${template} → ${to}`);

    const html = `
      <h2>Report automatico: ${template}</h2>
      <pre>${JSON.stringify(dati, null, 2)}</pre>
    `;

    return await inviaEmailLista({
      email: to,
      listId: null, // nessuna lista, invio diretto
      subject: `Report automatico: ${template}`,
      html,
      sender: SENDER_NEWSLETTER
    });

  } catch (err) {
    console.error("❌ Errore invio email automatica:", err);
  }
}

module.exports = {
  inviaEmailAutomatica
};
