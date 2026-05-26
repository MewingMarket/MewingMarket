// =========================================================
// AUTH-USER — BYPASS TOTALE (SAFE MODE ASSOLUTO)
// Non protegge nulla, non blocca nulla, non legge DB.
// Tutto passa sempre come guest.
// =========================================================

module.exports = function authUser(req, res, next) {
  req.uid = null;
  req.user = {
    id: null,
    email: null,
    ruolo: "guest",
    _diagnostica: "auth-bypass"
  };
  return next();
};
