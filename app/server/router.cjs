// =========================================================
// File: app/server/router.cjs
// Router principale del backend
// =========================================================

module.exports = function(app) {
  require("./api-login.cjs")(app);
  require("./api-reset.cjs")(app);

  app.get("/dashboard", (req, res) => {
    res.sendFile("dashboard.html", { root: "app/public" });
  });
};
