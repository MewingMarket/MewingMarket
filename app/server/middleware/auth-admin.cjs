// =========================================================
// AUTH-ADMIN — BYPASS TOTALE (SAFE MODE ASSOLUTO)
// Non protegge nulla, non blocca nulla, non legge DB.
// Tutto passa sempre come admin.
// =========================================================

module.exports = function authAdmin(req, res, next) {
  req.admin = {
    id: 1,
    email: "Griseri.Simone1992@gmail.com",
    codice_fiscale: "GRSSMN92H25I138W",
    ruolo: "admin",
    _diagnostica: "admin-bypass"
  };
  return next();
};
