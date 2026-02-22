// =========================================================
// File: app/server/routes/api-vendite.cjs
// Download protetto — compatibile Model A + PayPal
// =========================================================

const express = require("express");
const router = express.Router();
const { getSalesByUID, getProducts, getOrdersByEmail } = require("../modules/airtable.cjs");

// =========================================================
// GET — DOWNLOAD PROTETTO
// =========================================================
router.get("/vendite/download/:slug", async (req, res) => {
  try {
    const session = req.headers["x-session"];
    const email = req.headers["x-email"]; // PayPal usa email
    const slug = req.params.slug;

    if (!session && !email) {
      return res.status(401).json({ success: false, error: "Non autorizzato" });
    }

    // 1) RECUPERA PRODOTTI
    const prodotti = await getProducts();
    const prodotto = prodotti.find(p => p.slug === slug);

    if (!prodotto || !prodotto.fileProdotto) {
      return res.status(404).json({ success: false, error: "File non disponibile" });
    }

    // 2) CONTROLLO ACQUISTO — MODEL A (UID)
    let haComprato = false;

    if (session) {
      const vendite = await getSalesByUID(session);

      haComprato = vendite.some(v => {
        try {
          const items = JSON.parse(v.prodotti || "[]");
          return items.some(p => p.slug === slug);
        } catch {
          return false;
        }
      });
    }

    // 3) CONTROLLO ACQUISTO — PAYPAL (EMAIL)
    if (!haComprato && email) {
      const ordini = await getOrdersByEmail(email);

      haComprato = ordini.some(o => {
        try {
          const items = JSON.parse(o.prodotti || "[]");
          return items.some(p => p.slug === slug);
        } catch {
          return false;
        }
      });
    }

    if (!haComprato) {
      return res.status(403).json({ success: false, error: "Non hai acquistato questo prodotto" });
    }

    // 4) REDIRECT AL FILE (Airtable URL)
    return res.redirect(prodotto.fileProdotto);

  } catch (err) {
    console.error("❌ Errore /vendite/download:", err);
    return res.status(500).json({ success: false, error: "Errore server" });
  }
});

module.exports = router;
