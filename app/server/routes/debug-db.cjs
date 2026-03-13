const express = require("express");
const router = express.Router();
const db = require("../db/database.cjs");

router.get("/debug-db", (req, res) => {
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
          <th>Password</th>
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
