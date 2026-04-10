/**
 * File: app/server/routes/debug-db.cjs
 * Debug DB — SOLO ADMIN
 * Versione 2026.200 — require assoluti + protezione
 */

const express = require("express");
const path = require("path");

const R = (p) => require(path.join(process.cwd(), "app/server", p));

const router = express.Router();
const db = R("db/database.cjs");
const authAdmin = R("middleware/auth-admin.cjs");

router.get("/debug-db", authAdmin, (req, res) => {
  const utenti = db.prepare("SELECT * FROM utenti").all();

  let html = `
    <html>
    <head>
      <title>Debug DB</title>
      <style>
        table { border-collapse: collapse; width: 100%; }
        td, th { border: 1px solid #ccc; padding: 8px; }
      </style>
    </head>
    <body>
      <h1>Tabella utenti</h1>
      <table>
        <tr>
          <th>ID</th>
          <th>Email</th>
          <th>Password Hash</th>
          <th>Ruolo</th>
          <th>Token</th>
          <th>Created</th>
        </tr>
  `;

  for (const u of utenti) {
    html += `
      <tr>
        <td>${u.id}</td>
        <td>${u.email}</td>
        <td>${u.password_hash}</td>
        <td>${u.ruolo}</td>
        <td>${u.token}</td>
        <td>${u.created_at}</td>
      </tr>
    `;
  }

  html += `
      </table>
    </body>
    </html>
  `;

  res.send(html);
});

module.exports = router;
