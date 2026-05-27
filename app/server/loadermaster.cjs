// =========================================================
// LOADERMASTER — entrypoint frontend
// =========================================================

const express = require("express");
const path = require("path");

function log(...a){ console.log("[FRONTEND]", ...a); }

module.exports = async function loadermaster(app) {
  const PUBLIC_DIR = path.resolve("app/public");

  log(">> FRONTEND: statiche");
  app.use(express.static(PUBLIC_DIR));
  app.use("/admin", express.static(path.resolve("app/public/admin")));

  app.get("/admin/login", (req, res) => {
    res.sendFile(path.resolve("app/public/login.html"));
  });

  log("🟩 FRONTEND CARICATO (loadermaster completato)");
};
