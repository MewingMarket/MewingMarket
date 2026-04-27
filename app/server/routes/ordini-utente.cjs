/* =========================================================
   FILE: app/server/routes/ordini-utente.cjs
   MODALITÀ: Java‑mode (funzioni, no Express)
   DESCRIZIONE:
   - Restituisce ordini utente loggato
   - Annulla ordine
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
    if (!str) return [];
    return JSON.parse(str);
  } catch {
    return [];
  }
}

/* =========================================================
   FUNZIONE 1 — getOrdiniUtente
   (ex GET /ordini/utente)
========================================================= */
async function getOrdiniUtente(req) {
  try {
    const userId = req.user.id;

    const rows = db.prepare(`
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
    `).all(userId);

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

    return {
      success: true,
      ordini
    };

  } catch (err) {
    console.error("❌ Errore getOrdiniUtente:", err);
    return {
      success: false,
      error: "Errore server"
    };
  }
}

/* =========================================================
   FUNZIONE 2 — annullaOrdine
   (ex POST /ordini/annulla/:id)
========================================================= */
async function annullaOrdine(req) {
  try {
    const ordineId = req.params.id;
    const userId = req.user.id;

    const ordine = db.prepare(`
      SELECT *
      FROM ordini
      WHERE id = ? AND utente_id = ?
      LIMIT 1
    `).get(ordineId, userId);

    if (!ordine) {
      return { success: false, error: "Ordine non trovato" };
    }

    if (ordine.stato === "completato") {
      return {
        success: false,
        error: "Ordine già completato, non annullabile"
      };
    }

    if (ordine.stato === "annullato") {
      return {
        success: true,
        message: "Ordine già annullato"
      };
    }

    // Aggiorna stato
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
    const utente = db.prepare(`
      SELECT email
      FROM utenti
      WHERE id = ?
      LIMIT 1
    `).get(userId);

    const emailUtente = utente?.email || "";

    // Email annullamento
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

    return {
      success: true,
      message: "Ordine annullato correttamente"
    };

  } catch (err) {
    console.error("❌ Errore annullaOrdine:", err);
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
  getOrdiniUtente,
  annullaOrdine
};
