// app/routes/versione.cjs

module.exports = function (app) {
  app.get("/api/debug/version", (req, res) => {
    res.json({
      success: true,
      versione: "2026-03-13-00:10",
      descrizione: "Endpoint di debug per verificare la build in produzione",
      timestamp: new Date().toISOString(),
      note: "Se questa versione non cambia dopo un deploy, Render sta usando una build vecchia."
    });
  });
};
