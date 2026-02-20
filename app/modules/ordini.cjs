/**
 * =========================================================
 * File: app/modules/ordini.cjs
 * Gestione ordini + cashout (store interno)
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
   CARICAMENTO ORDINI (fallback locale)
========================================================= */
function loadOrders() {
  try {
    if (!fs.existsSync(ORDERS_PATH)) return [];
    const raw = fs.readFileSync(ORDERS_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/* =========================================================
   SALVATAGGIO ORDINI (fallback locale)
========================================================= */
function saveOrders(orders) {
  try {
    fs.writeFileSync(ORDERS_PATH, JSON.stringify(orders, null, 2));
  } catch (err) {
    console.error("❌ Errore salvataggio orders.json:", err);
  }
}

/* =========================================================
   CREA ORDINE IN AIRTABLE
========================================================= */
async function createOrder(order) {
  const record = await base(TABLE).create(order);
  return record.id;
}

/* =========================================================
   LISTA ORDINI
========================================================= */
async function getAllOrders() {
  const records = await base(TABLE).select({}).all();
  return records.map(r => ({ id: r.id, ...r.fields }));
}

/* =========================================================
   AGGIORNA STATO ORDINE
========================================================= */
async function updateOrder(id, fields) {
  return base(TABLE).update(id, fields);
}

module.exports = {
  loadOrders,
  saveOrders,
  createOrder,
  getAllOrders,
  updateOrder
};
