/**
 * =========================================================
 * RIMBORSO — Procedi al rimborso (solo backend)
 * Versione 2026.950 — require assoluti + FIX sicurezza + FIX stato
 * =========================================================
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const db = R("db/database.cjs");
const jsonGen = R("modules/generatore-json.cjs");
const { inviaEmailOrdineAnnullato } = R("modules/email-ordine-annullato.cjs");
const authUser = R("middleware/auth-user.cjs");

const router = express.Router();

/**
 * Helper sicuro
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
 * POST /api/rimborso/procedi/:id
 * Protetto da auth-user (admin)
 * =========================================================
 */
router.post("/procedi/:id", authUser, async (req, res) => {
  const ordineId = req.params.id;

  try {
    // 1) Recupera ordine
    const stmt = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ?
      LIMIT 1
    `);

    const ordine = stmt.get(ordineId);

    if (!ordine) {
      return res.json({ success: false, error: "Ordine non trovato." });
    }

    // 2) Solo ordini completati possono essere rimborsati
    if (ordine.stato !== "completato") {
      return res.json({
        success: false,
        error: "Ordine non rimborsabile."
      });
    }

    // 3) Aggiorna stato → rimborsato
    db.prepare(`
      UPDATE ordini
      SET stato = 'rimborsato',
          download_token = NULL,
          data_ordine = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(ordineId);

    // Aggiorna JSON mirror
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    // 4) Email conferma rimborso
    const stmtUser = db.prepare(`
      SELECT email FROM utenti WHERE id = ? LIMIT 1
    `);

    const utente = stmtUser.get(ordine.utente_id);

    try {
      await inviaEmailOrdineAnnullato({
        email: utente.email,
        ordine: {
          id: ordine.id,
          prodotti: safeParse(ordine.prodotti_json),
          totale: ordine.totale_cent / 100,
          stato: "rimborsato"
        }
      });
    } catch (err) {
      console.error("⚠️ Errore email rimborso:", err);
    }

    return res.json({ success: true });

  } catch (err) {
    console.error("❌ Errore procedi rimborso:", err);
    return res.json({ success: false, error: "Errore interno." });
  }
});

module.exports = router;
