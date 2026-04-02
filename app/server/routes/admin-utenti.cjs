// =========================================================
// Admin — Gestione Utenti
// =========================================================

const express = require("express");
const router = express.Router();
const db = require("../../db.cjs");
const axios = require("axios"); // PATCH: per Brevo
const { LISTA_NEWSLETTER } = require("../../modules/liste-brevo.cjs");
const { requireAdmin } = require("../../middleware/require-admin.cjs");

/* =========================================================
   Helper: stato newsletter per una email
   - 1° tentativo: Brevo (lista 8)
   - fallback: ultimo evento in newsletter_log
========================================================= */
async function getNewsletterStatus(email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  if (!cleanEmail) return false;

  // 1) Prova con Brevo
  try {
    const result = await axios.get(
      `https://api.brevo.com/v3/contacts/${encodeURIComponent(cleanEmail)}`,
      {
        headers: {
          "api-key": process.env.BREVO_API_KEY
        }
      }
    );

    const subscribed = result.data?.listIds?.includes(LISTA_NEWSLETTER) || false;
    return subscribed;
  } catch (err) {
    console.error("⚠️ Brevo non disponibile per", cleanEmail, "→ uso newsletter_log");
  }

  // 2) Fallback: ultimo evento nel log
  try {
    const row = await db.get(
      `
      SELECT azione
      FROM newsletter_log
      WHERE email = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [cleanEmail]
    );

    if (!row) return false;
    if (row.azione === "subscribe") return true;
    if (row.azione === "unsubscribe") return false;

    return false;
  } catch (err) {
    console.error("❌ Errore lettura newsletter_log per", cleanEmail, ":", err);
    return false;
  }
}

/* =========================================================
   LISTA UTENTI
========================================================= */
router.get("/lista", requireAdmin, async (req, res) => {
  try {
    const utenti = await db.all(`
      SELECT 
        email,
        logged_in,
        bloccato
      FROM utenti
      ORDER BY email ASC
    `);

    const arr = [];
    for (const u of utenti) {
      const newsletter = await getNewsletterStatus(u.email);

      arr.push({
        email: u.email,
        newsletter,
        logged_in: u.logged_in,
        bloccato: u.bloccato
      });
    }

    res.json({ success: true, utenti: arr });

  } catch (err) {
    console.error("Errore lista utenti:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

/* =========================================================
   BLOCCA / SBLOCCA UTENTE
========================================================= */
router.post("/blocco", requireAdmin, async (req, res) => {
  const { email, bloccato } = req.body;

  if (!email) return res.json({ success: false, error: "Email mancante." });

  try {
    await db.run(
      `UPDATE utenti SET bloccato = ? WHERE email = ?`,
      [bloccato ? 1 : 0, email]
    );

    res.json({ success: true });

  } catch (err) {
    console.error("Errore blocco utente:", err);
    res.json({ success: false, error: "Errore server." });
  }
});

module.exports = router;
