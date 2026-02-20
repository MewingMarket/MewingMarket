// =========================================================
// File: app/server/router.cjs
// Router principale del backend
// =========================================================

module.exports = function(app) {

  // --- AUTENTICAZIONE ---
  require("./api-login.cjs")(app);
  require("./api-reset.cjs")(app);

  // --- PRODOTTI (catalogo + singolo) ---
  require("./api-prodotti.cjs")(app);

  // --- DASHBOARD LOGIN ---
  app.get("/dashboard", (req, res) => {
    res.sendFile("dashboard-login.html", { root: "app/public" });
  });

};
