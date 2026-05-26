// =========================================================
// API-GUARD — BYPASS TOTALE (SAFE MODE ASSOLUTO)
// Non blocca nulla, non fa rate limit, non valida nulla.
// Tutto passa sempre.
// =========================================================

module.exports = function apiGuard(req, res, next) {
  return next();
};
