/* =========================================================
   UNIVERSAL JSON — Versione 2027.900
   - Intercetta TUTTE le risposte
   - Converte SEMPRE in JSON valido
   - Estrae dati anche da HTML / testo / errori
   - Salva tutto in generico.json
========================================================= */

const fs = require("fs");
const path = require("path");

module.exports = function universalJson(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Percorso file generico
  const filePath = path.join(process.cwd(), "app/server/db/generico.json");

  function salva(payload) {
    try {
      fs.writeFileSync(filePath, JSON.stringify(payload, null, 2));
    } catch (e) {
      console.error("UNIVERSAL JSON → errore salvataggio:", e);
    }
  }

  // PATCH JSON
  res.json = function (data) {
    const payload = {
      success: true,
      endpoint: req.originalUrl,
      data,
      raw: null,
      error: null,
      timestamp: Date.now()
    };

    salva(payload);
    return originalJson(payload);
  };

  // PATCH SEND (HTML, testo, errori)
  res.send = function (body) {
    let payload = {
      success: false,
      endpoint: req.originalUrl,
      data: null,
      raw: null,
      error: null,
      timestamp: Date.now()
    };

    // Se è JSON valido
    try {
      const parsed = JSON.parse(body);
      payload.success = true;
      payload.data = parsed;
      salva(payload);
      return originalJson(payload);
    } catch (e) {}

    // Se è HTML
    if (typeof body === "string" && body.trim().startsWith("<")) {
      payload.raw = body.slice(0, 2000);
      payload.error = "HTML ricevuto";
      salva(payload);
      return originalJson(payload);
    }

    // Se è testo
    payload.raw = String(body).slice(0, 2000);
    payload.error = "Risposta non JSON";
    salva(payload);
    return originalJson(payload);
  };

  next();
};
