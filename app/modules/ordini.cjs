/**
 * =========================================================
 * File: app/modules/ordini.cjs
 * Gestione ordini (Airtable) — Model A
 * =========================================================
 */

const fs = require("fs");
const path = require("path");
const Airtable = require("airtable");

const ROOT = path.resolve(__dirname, "..");
const DATA_DIR = path.join(ROOT, "data");
const ORDERS_PATH = path.join(DATA_DIR, "orders.json");

const base = new Airtable({ apiKey: process.env.AIRTABLE_PAT })
  .base(process.env.AIRTABLE_BASE);

const TABLE = "Ordini";

/* =========================================================
   FALLBACK LOCALE
========================================================= */
function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_PATH)) return [];
    return JSON.parse(fs.readFileSync(ORDERS_PATH, "utf8"));
  } catch {
    return [];
  }
}

function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("❌ Errore salvataggio orders.json:", err);
  }
}

/* =========================================================
   CREA ORDINE IN AIRTABLE (MODEL A)
========================================================= */
async function createOrder({ uid, email, prodotti, totale, metodo = "PayPal" }) {
  try {
    const record = await base(TABLE).create({
      id_ordine: Date.now(), // ID univoco
      utente: email,
      prodotti: JSON.stringify(prodotti),
      totale,
      data: new Date().toISOString(),
      stato: "completato",
      metodo_pagamento: metodo
    });

    return record.id;

  } catch (err) {
    console.error("❌ Errore createOrder:", err);
    throw err;
  }
}

/* =========================================================
   LISTA ORDINI
========================================================= */
async function getAllOrders() {
  try {
    const records = await base(TABLE).select().all();

    return records.map(r => {
      let prodotti = [];
      try {
        prodotti = JSON.parse(r.get("prodotti") || "[]");
      } catch {}

      return {
        id: r.id,
        id_ordine: r.get("id_ordine"),
        utente: r.get("utente"),
        prodotti,
        totale: r.get("totale"),
        data: r.get("data"),
        stato: r.get("stato"),
        metodo_pagamento: r.get("metodo_pagamento"),
        paypal_transaction_id: r.get("paypal_transaction_id")
      };
    });

  } catch (err) {
    console.error("❌ Errore getAllOrders:", err);
    return [];
  }
}

/* =========================================================
   AGGIORNA ORDINE
========================================================= */
async function updateOrder(id, fields) {
  try {
    return await base(TABLE).update(id, fields);
  } catch (err) {
    console.error("❌ Errore updateOrder:", err);
    throw err;
  }
}

module.exports = {
  loadOrders,
  saveOrders,
  createOrder,
  getAllOrders,
  updateOrder
};
