/* =========================================================
   FILE: app/server/routes/paypal-ricrea.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Rigenera pagamento PayPal per ordini in attesa
   - Aggiorna DB
   - Aggiorna JSON mirror
   - Aggiunge utente a lista Brevo
   - Invia email attesa pagamento
========================================================= */

const path = require("path");

const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const paypal = require(path.join(process.cwd(), "app/server/modules/paypal.cjs"));
const { inviaEmailAttesa } = require(path.join(process.cwd(), "app/server/modules/email-attesa.cjs"));
const { addToList } = require(path.join(process.cwd(), "app/server/modules/liste-brevo.cjs"));
const jsonGen = require(path.join(process.cwd(), "app/server/modules/generatore-json.cjs"));

/* =========================================================
   Helper JSON
========================================================= */
function safeParse(str) {
  try {
    if (!str) return [];
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   FUNZIONE: paypalRicrea
   (ex POST /api/paypal/ricrea/:id)
========================================================= */
async function paypalRicrea(req) {
  const userId = req.user?.id;
  const orderId = req.params.id;

  if (!userId || !orderId) {
    return { success: false, error: "Parametri mancanti." };
  }

  try {
    // 1) Recupera ordine dal DB
    const ordine = db.prepare(`
      SELECT 
        o.id,
        o.utente_id,
        o.prodotti_json,
        o.totale_cent,
        o.stato,
        o.paypal_transaction_id,
        u.email AS utente_email
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      WHERE o.id = ? AND o.utente_id = ?
      LIMIT 1
    `).get(orderId, userId);

    if (!ordine) {
      return { success: false, error: "Ordine non trovato." };
    }

    // Solo ordini non completati possono essere rigenerati
    if (ordine.stato === "completato") {
      return {
        success: false,
        error: "Ordine già completato, non rigenerabile."
      };
    }

    // 2) Prepara dati per PayPal
    const prodotti = safeParse(ordine.prodotti_json);

    const paypalOrder = await paypal.createOrder({
      totale_cent: ordine.totale_cent,
      prodotti
    });

    if (!paypalOrder || !paypalOrder.id || !paypalOrder.url) {
      return { success: false, error: "Errore PayPal." };
    }

    // 3) Aggiorna ordine → in_attesa_pagamento
    db.prepare(`
      UPDATE ordini
      SET stato = 'in_attesa_pagamento',
          paypal_transaction_id = ?,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ? AND utente_id = ?
    `).run(paypalOrder.id, orderId, userId);

    // Aggiorna JSON mirror
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON (ricrea):", err);
    }

    const emailUtente = ordine.utente_email || "";

    // 4) Aggiungi utente alla lista 12 (clienti in attesa)
    try {
      if (emailUtente) {
        await addToList(12, emailUtente);
      }
    } catch (err) {
      console.error("⚠️ Errore addToList (lista 12):", err);
    }

    // 5) Email premium (logo + social)
    try {
      if (emailUtente) {
        await inviaEmailAttesa({
          email: emailUtente,
          url: paypalOrder.url
        });
      }
    } catch (err) {
      console.error("⚠️ Errore inviaEmailAttesa:", err);
    }

    // 6) Risposta
    return {
      success: true,
      url: paypalOrder.url
    };

  } catch (err) {
    console.error("❌ Errore paypalRicrea:", err);
    return { success: false, error: "Errore interno." };
  }
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  paypalRicrea
};
