/**
 * =========================================================
 * File: app/server/routes/paypal-cancel.cjs
 * Annulla ordine PayPal (SQL) + email annullamento + JSON mirror
 * Versione 2026.950 — require assoluti + FIX sicurezza + FIX stato
 * =========================================================
 */

const express = require("express");
const path = require("path");

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailOrdineAnnullato } = R("modules/email-ordine-annullato.cjs");
const authUser = R("middleware/auth-user.cjs");

const router = express.Router();

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/**
 * =========================================================
 * GET /api/paypal/cancel-order?orderId=xxxx
 * Protetto da auth-user
 * =========================================================
 */
router.get("/paypal/cancel-order", authUser, async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const userId = req.user.id;

    if (!orderId || !userId) {
      return res.json({ success: false, error: "Parametri mancanti" });
    }

    // =========================================================
    // 1) Recupera ordine dal DB
    // =========================================================
    const stmtFind = db.prepare(`
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
    `);

    const ordine = stmtFind.get(orderId, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    // Se già completato → non annullabile
    if (ordine.stato === "completato") {
      return res.json({
        success: false,
        error: "Ordine già completato, non annullabile"
      });
    }

    // Se già annullato → ritorna ordine
    if (ordine.stato === "annullato") {
      return res.json({
        success: true,
        message: "Ordine già annullato",
        order: {
          id: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: ordine.stato
        }
      });
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
    // 3) Email annullamento (Brevo o sandbox fallback)
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
    // 4) Risposta al frontend
    // =========================================================
    return res.json({
      success: true,
      message: "Ordine annullato correttamente",
      order: {
        id: ordine.id,
        prodotti: safeParse(ordine.prodotti_json),
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
