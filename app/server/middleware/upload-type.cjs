/**
 * =========================================================
 * File: app/server/middleware/upload-type.cjs
 * Middleware: setUploadType
 * Imposta il tipo di upload (file, immagine, ecc.)
 * Versione 2026.99
 * =========================================================
 */

module.exports = function setUploadType(type) {
  return function (req, res, next) {
    try {
      req.uploadType = type;
      next();
    } catch (err) {
      console.error("❌ Errore setUploadType:", err);
      return res.json({ success: false, error: "Errore middleware upload" });
    }
  };
};
