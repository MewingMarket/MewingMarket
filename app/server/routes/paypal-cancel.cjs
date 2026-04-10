/**
 * =========================================================
 * File: app/server/routes/paypal-cancel.cjs
 * Annulla ordine PayPal (SQL) + email annullamento + JSON mirror
 * Versione 2026.200 — require assoluti
 * =========================================================
 */

const express = require("express");
const path = require("path");

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const { inviaEmailOrdineAnnullato } = R("modules/email-ordine-annullato.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { syncBrevoUtenteStatoReale } = R("modules/liste-brevo.cjs");

const router = express.Router();

/**
 * =========================================================
 * GET /api/paypal/cancel-order?orderId=xxxx
 * =========================================================
 */
router.get("/paypal/cancel-order", async (req, res) => {
  try {
    const orderId = req.query.orderId;

    if (!orderId) {
      return res.json({ success: false, error: "OrderId mancante" });
    }

    // Recupera ordine
    const stmtFind = db.prepare(`
      SELECT id, stato, utente_id, prodotti_json, totale_cent
      FROM ordini
      WHERE id = ?
    `);

    const ordine = stmtFind.get(orderId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // Se già completato → non lo tocchiamo
    if (ordine.stato === "completato" || ordine.stato === "COMPLETED") {
      return res.json({
        success: true,
        message: "Ordine già completato, nessuna modifica",
        order: {
          id: ordine.id,
          id_ordine: ordine.id,
          prodotti: JSON.parse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: ordine.stato
        }
      });
    }

    // Se già annullato → non lo tocchiamo
    if (ordine.stato === "annullato" || ordine.stato === "CANCELLED") {
      return res.json({
        success: true,
        message: "Ordine già annullato",
        order: {
          id: ordine.id,
          id_ordine: ordine.id,
          prodotti: JSON.parse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: ordine.stato
        }
      });
    }

    // Aggiorna stato → annullato
    const stmtUpdate = db.prepare(`
      UPDATE ordini
      SET stato = 'annullato',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    stmtUpdate.run(orderId);

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    // Recupera email utente
    const stmtUser = db.prepare(`
      SELECT email
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `);

    const utente = stmtUser.get(ordine.utente_id);
    const emailUtente = utente?.email || "";

    // Invia email annullamento
    try {
      inviaEmailOrdineAnnullato({
        email: emailUtente,
        ordine: {
          id: ordine.id,
          id_ordine: ordine.id,
          prodotti: JSON.parse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: "annullato"
        }
      });
    } catch (err) {
      console.error("⚠️ Errore invio email annullamento:", err);
    }

    // ⭐ PATCH BREVO — PayPal cancel → NON è cliente
    try {
      await syncBrevoUtenteStatoReale({
        email: emailUtente,
        cliente: false
      });
    } catch (err) {
      console.error("❌ Errore sync Brevo:", err);
    }

    return res.json({
      success: true,
      message: "Ordine annullato correttamente",
      order: {
        id: ordine.id,
        id_ordine: ordine.id,
        prodotti: JSON.parse(ordine.prodotti_json),
        totale: ordine.totale_cent / 100,
        stato: "annullato"
      }
    });

  } catch (err) {
    console.error("❌ Errore cancel-order:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
