/**
 * =========================================================
 * File: app/modules/ordini.cjs
 * Gestione ordini — Versione SQL definitiva + JSON mirror
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluti
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const jsonGen = require(path.join(process.cwd(), "app/server/modules/generatore-json.cjs"));

/* =========================================================
   CREA ORDINE (SQL)
   - uid: ID PayPal o sessione
   - email: email utente
   - prodotti: array multiprodotto
   - totale: totale in €
   - metodo: PayPal / Stripe / altro
========================================================= */
async function createOrder({ uid, email, prodotti, totale, metodo = "PayPal" }) {
  try {
    // 1) Trova utente
    const utente = db
      .prepare("SELECT id FROM utenti WHERE email = ?")
      .get(email);

    if (!utente) {
      throw new Error("Utente non trovato");
    }

    // 2) Inserisci ordine
    const result = db.prepare(`
      INSERT INTO ordini (
        utente_id,
        prodotti_json,
        totale_cent,
        stato,
        metodo_pagamento,
        paypal_transaction_id
      ) VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      utente.id,
      JSON.stringify(prodotti),
      Math.round(totale * 100),
      "completato",
      metodo,
      uid
    );

    const orderId = result.lastInsertRowid;

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    return orderId;

  } catch (err) {
    console.error("❌ Errore createOrder (SQL):", err);
    throw err;
  }
}

/* =========================================================
   LISTA ORDINI (SQL)
========================================================= */
async function getAllOrders() {
  try {
    const rows = db.prepare(`
      SELECT o.*, u.email AS utente_email
      FROM ordini o
      LEFT JOIN utenti u ON u.id = o.utente_id
      ORDER BY o.id DESC
    `).all();

    return rows.map(r => ({
      id: r.id,
      id_ordine: r.id, // compatibilità con vecchia UI
      utente: r.utente_email,
      prodotti: JSON.parse(r.prodotti_json || "[]"),
      totale: r.totale_cent / 100,
      data: r.data_ordine,
      stato: r.stato,
      metodo_pagamento: r.metodo_pagamento,
      paypal_transaction_id: r.paypal_transaction_id
    }));

  } catch (err) {
    console.error("❌ Errore getAllOrders (SQL):", err);
    return [];
  }
}

/* =========================================================
   AGGIORNA ORDINE (SQL)
========================================================= */
async function updateOrder(id, fields) {
  try {
    const allowed = [
      "stato",
      "metodo_pagamento",
      "paypal_transaction_id",
      "prodotti_json",
      "totale_cent"
    ];

    const updates = [];
    const values = [];

    for (const key of Object.keys(fields)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = ?`);
        values.push(fields[key]);
      }
    }

    if (!updates.length) return false;

    values.push(id);

    db.prepare(`
      UPDATE ordini
      SET ${updates.join(", ")},
          data_ordine = data_ordine
      WHERE id = ?
    `).run(values);

    // 🔥 Aggiorna JSON mirror ordini
    try {
      await jsonGen.exportOrders();
    } catch (err) {
      console.error("⚠️ Errore exportOrders JSON:", err);
    }

    return true;

  } catch (err) {
    console.error("❌ Errore updateOrder (SQL):", err);
    throw err;
  }
}

module.exports = {
  loadOrders: () => [], // mantenuto per compatibilità, non usato più
  saveOrders: () => {}, // mantenuto per compatibilità, non usato più
  createOrder,
  getAllOrders,
  updateOrder
};
