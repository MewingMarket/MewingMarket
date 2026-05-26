/* =========================================================
   UNIVERSAL JSON — Versione 2027.903 SAFE MODE (NO-REDEPLOY)
   - Salva SOLO in /var/data/json (persistente, non monitorato)
   - Non tocca Buffer
   - Non crea loop
   - Non causa restart Render
========================================================= */

const fs = require("fs");
const path = require("path");

// 🔥 Directory persistente (NON monitorata da Render)
const PERSIST_DIR = "/var/data/json";
const FILE_PATH = path.join(PERSIST_DIR, "generico.json");

// 🔥 Assicura che la cartella esista
try {
  fs.mkdirSync(PERSIST_DIR, { recursive: true });
} catch (e) {
  console.error("UNIVERSAL JSON → errore creazione dir persistente:", e);
}

module.exports = function universalJson(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  function salva(payload) {
    try {
      fs.writeFileSync(FILE_PATH, JSON.stringify(payload, null, 2));
    } catch (e) {
      console.error("UNIVERSAL JSON → errore salvataggio:", e);
    }
  }

  /* =========================================================
     PATCH JSON
  ========================================================== */
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

  /* =========================================================
     PATCH SEND — SAFE MODE
  ========================================================== */
  res.send = function (body) {

    // 🔥 Buffer → NON toccare
    if (Buffer.isBuffer(body)) {
      return originalSend(body);
    }

    let payload = {
      success: false,
      endpoint: req.originalUrl,
      data: null,
      raw: null,
      error: null,
      timestamp: Date.now()
    };

    // 🔥 Se è JSON valido
    if (typeof body === "string") {
      try {
        const parsed = JSON.parse(body);
        payload.success = true;
        payload.data = parsed;
        salva(payload);
        return originalJson(payload);
      } catch (e) {
        // Non è JSON → continua
      }
    }

    // 🔥 Se è HTML
    if (typeof body === "string" && body.trim().startsWith("<")) {
      payload.raw = body.slice(0, 2000);
      payload.error = "HTML ricevuto";
      salva(payload);
      return originalJson(payload);
    }

    // 🔥 Qualsiasi altro tipo → testo
    payload.raw = String(body).slice(0, 2000);
    payload.error = "Risposta non JSON";
    salva(payload);
    return originalJson(payload);
  };

  next();
};
