module.exports = function (app) {

  app.get("/api/versione", (req, res) => {
    res.json({
      versione: "2027.001",
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.get("/api/debug/version", (req, res) => {
    res.json({
      success: true,
      versione: "2027.001-debug",
      timestamp: new Date().toISOString()
    });
  });

};
