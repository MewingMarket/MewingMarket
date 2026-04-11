/**
 * =========================================================
 * File: app/server/routes/ordini-utente.cjs
 * Restituisce gli ordini dell'utente loggato (SQL)
 * + Annulla ordine (SQL)
 * Versione 2026.950 — require assoluti + FIX sicurezza + FIX stato
 * =========================================================
 */

const express = require("express");
const path = require("path");

// PATCH: require assoluto
const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const authUser = R("middleware/auth-user.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailOrdineAnnullato } = R("modules/email-ordine-annullato.cjs");

const router = express.Router();

/**
 * Helper sicuro per JSON
 */
function safeParse(str) {
  try {
    if (!str) return [];
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/**
 * =========================================================
 * GET /api/ordini/utente
 * Protetto da auth-user
 * =========================================================
 */
router.get("/ordini/utente", authUser, (req, res) => {
  try {
    const userId = req.user.id;

    const stmt = db.prepare(`
      SELECT 
        id,
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        paypal_transaction_id,
        download_token,
        data_ordine
      FROM ordini
      WHERE utente_id = ?
      ORDER BY id DESC
    `);

    const rows = stmt.all(userId);

    const ordini = rows.map(o => {
      const prodotti = safeParse(o.prodotti_json).map(p => {
        const prod = db.prepare(`
          SELECT 
            titolo,
            titolo_breve,
            descrizione_lunga,
            descrizione_breve,
            file_consegna_url
          FROM prodotti
          WHERE id = ?
          LIMIT 1
        `).get(p.prodotto_id);

        return {
          prodotto_id: p.prodotto_id,
          qty: p.qty || 1,
          prezzo_cent: p.prezzo_cent,
          titolo: prod?.titolo || prod?.titolo_breve || "Prodotto digitale",
          titolo_breve: prod?.titolo_breve || "",
          descrizione_lunga: prod?.descrizione_lunga || prod?.descrizione_breve || "",
          file_consegna_url: prod?.file_consegna_url || null
        };
      });

      return {
        id: o.id,
        prodotti,
        totale_cent: o.totale_cent,
        totale: o.totale_cent / 100,
        stato: o.stato,
        data_ordine: o.data_ordine,
        metodo_pagamento: o.metodo_pagamento,
        paypal_transaction_id: o.paypal_transaction_id,
        download_token: o.download_token || null
      };
    });

    return res.json({
      success: true,
      ordini
    });

  } catch (err) {
    console.error("❌ Errore /ordini/utente:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

/**
 * =========================================================
 * POST /api/ordini/annulla/:id
 * Protetto da auth-user
 * =========================================================
 */
router.post("/ordini/annulla/:id", authUser, async (req, res) => {
  try {
    const ordineId = req.params.id;
    const userId = req.user.id;

    const stmtFind = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `);

    const ordine = stmtFind.get(ordineId, userId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato" });
    }

    if (ordine.stato === "completato") {
      return res.json({
        success: false,
        error: "Ordine già completato, non annullabile"
      });
    }

    if (ordine.stato === "annullato") {
      return res.json({
        success: true,
        message: "Ordine già annullato"
      });
    }

    // Aggiorna stato → annullato
    db.prepare(`
      UPDATE ordini
      SET stato = 'annullato',
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordineId);

    // Aggiorna JSON mirror
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

    const utente = stmtUser.get(userId);
    const emailUtente = utente?.email || "";

    // Email annullamento (Brevo o sandbox fallback)
    try {
      await inviaEmailOrdineAnnullato({
        email: emailUtente,
        ordine: {
          id: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100
        }
      });
    } catch (err) {
      console.error("⚠️ Errore invio email annullamento:", err);
    }

    return res.json({
      success: true,
      message: "Ordine annullato correttamente"
    });

  } catch (err) {
    console.error("❌ Errore annulla ordine:", err);
    return res.json({
      success: false,
      error: "Errore server"
    });
  }
});

module.exports = router;
