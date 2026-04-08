/**
 * =========================================================
 * File: app/server/middleware/index.js
 * Caricamento middleware globali
 * =========================================================
 */

const path = require("path");

// PATCH: require assoluti
const authUser = require(path.join(process.cwd(), "app/server/middleware/auth-user.cjs"));
const authAdmin = require(path.join(process.cwd(), "app/server/middleware/auth-admin.cjs"));

module.exports = {
  authUser,
  authAdmin
};
