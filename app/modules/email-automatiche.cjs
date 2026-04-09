/* FILE: app/modules/email-automatiche.cjs */
/**
 * =========================================================
 * File: app/modules/email-automatiche.cjs
 * SCOPO: Invio email automatiche interne (KPI, report, alert)
 * FUTURE-PROOF — Nessuna logica invasiva
 * + PATCH 2026: opzionale uso flag per template specifici
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluti CORRETTI (server/modules)
const { inviaEmailLista } = require(path.join(process.cwd(), "app/server/modules/invia-email-lista.cjs"));
const { SENDER_NEWSLETTER } = require(path.join(process.cwd(), "app/server/modules/email-senders.cjs"));

// ⚠️ Nuovo require: uso DB per eventuali flag su template
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));

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

    // 🔥 Firewall opzionale per template specifici (es. report_mensile)
    const flagTipo = `auto_${template}`;
    const flagRef = to || "internal";

    if (db.hasFlag(flagTipo, flagRef)) {
      console.log("[EMAIL-AUTO] Già inviato template", template, "a", flagRef);
      return "ALREADY_SENT";
    }

    const html = `
      <h2>Report automatico: ${template}</h2>
      <pre>${JSON.stringify(dati, null, 2)}</pre>
    `;

    const res = await inviaEmailLista({
      email: to,
      listId: null,
      subject: `Report automatico: ${template}`,
      html,
      sender: SENDER_NEWSLETTER,
      tipo: "report"
    });

    try {
      db.setFlag(flagTipo, flagRef);
    } catch (err) {
      console.error("❌ Errore setFlag email-automatica:", err);
    }

    return res;

  } catch (err) {
    console.error("❌ Errore invio email automatica:", err);
  }
}

module.exports = {
  inviaEmailAutomatica
};
