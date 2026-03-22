/**
 * =========================================================
 * File: app/server/middleware/index.js
 * Caricamento middleware globali
 * =========================================================
 */

const authUser = require("./auth-user.cjs");
const authAdmin = require("./auth-admin.cjs");

module.exports = {
  authUser,
  authAdmin
};
