/* =========================================================
   FILE: app/server/routes/paypal-cancel.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Annulla ordine PayPal
   - Aggiorna DB
   - Aggiorna JSON mirror
   - Invia email annullamento
========================================================= */

const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailOrdineAnnullato } = R("modules/email-ordine-annullato.cjs");

/* =========================================================
   Helper JSON
========================================================= */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   FUNZIONE: paypalCancelOrder
   (ex GET /api/paypal/cancel-order?orderId=xxxx)
========================================================= */
async function paypalCancelOrder(req) {
  try {
    const orderId = req.query.orderId;
    const userId = req.user.id;

    if (!orderId || !userId) {
      return { success: false, error: "Parametri mancanti" };
    }

    // =========================================================
    // 1) Recupera ordine dal DB
    // =========================================================
    const ordine = db.prepare(`
      SELECT 
        o.id,
        o.utente_id,
        o.prodotti_json,
        o.totale_cent,
        o.stato,
        u.email AS utente_email
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      WHERE o.id = ? AND o.utente_id = ?
      LIMIT 1
    `).get(orderId, userId);

    if (!ordine) {
      return { success: false, error: "Ordine non trovato" };
    }

    // Se già completato → non annullabile
    if (ordine.stato === "completato") {
      return {
        success: false,
        error: "Ordine già completato, non annullabile"
      };
    }

    // Se già annullato → ritorna ordine
    if (ordine.stato === "annullato") {
      return {
        success: true,
        message: "Ordine già annullato",
        order: {
          id: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: ordine.stato
        }
      };
    }

    // =========================================================
    // 2) Aggiorna stato → annullato
    // =========================================================
    db.prepare(`
      UPDATE ordini
      SET stato = 'annullato',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(orderId);

    // Aggiorna JSON mirror
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    const emailUtente = ordine.utente_email || "";

    // =========================================================
    // 3) Email annullamento
    // =========================================================
    try {
      if (emailUtente) {
        await inviaEmailOrdineAnnullato({
          email: emailUtente,
          ordine: {
            id: ordine.id,
            prodotti: safeParse(ordine.prodotti_json),
            totale: ordine.totale_cent / 100,
            stato: "annullato"
          }
        });
      }
    } catch (err) {
      console.error("⚠️ Errore invio email annullamento:", err);
    }

    // =========================================================
    // 4) Risposta
    // =========================================================
    return {
      success: true,
      message: "Ordine annullato correttamente",
      order: {
        id: ordine.id,
        prodotti: safeParse(ordine.prodotti_json),
        totale: ordine.totale_cent / 100,
        stato: "annullato"
      }
    };

  } catch (err) {
    console.error("❌ Errore paypalCancelOrder:", err);
    return {
      success: false,
      error: "Errore server"
    };
  }
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  paypalCancelOrder
};
