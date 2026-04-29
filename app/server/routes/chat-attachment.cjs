/* =========================================================
   FILE: app/server/routes/chat-attachment.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE: Gestione allegati chat (file, immagini, pdf)
========================================================= */

const path = require("path");
const fs = require("fs");

// BOT
const { handleConversation } = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));

// GA4
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

/* =========================================================
   FUNZIONE PRINCIPALE — chatAttachment
========================================================= */
async function chatAttachment(req) {
  console.log("[DEBUG chatAttachment] chiamato");

  const uid = req.uid;
  const file = req.file; // middleware uploads.cjs
  const message = req.body?.message || "";

  if (!file) {
    return {
      success: false,
      error: "Nessun file ricevuto"
    };
  }

  try {
    // PATCH: protezione catalogo
    if (!global.catalogReady) {
      return {
        success: true,
        reply: "Sto pensando… un attimo 😄",
        delay: true
      };
    }

    // Prepara input per il bot
    req.attachment = {
      path: file.path,
      originalName: file.originalname,
      mime: file.mimetype,
      size: file.size
    };

    const finalReply = await handleConversation(req);

    // GA4 tracking
    trackGA4("chat_attachment", {
      uid,
      message,
      file: file.originalname
    });

    // Cleanup file
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.error("⚠️ Errore rimozione file:", err);
    }

    return {
      success: true,
      ...finalReply
    };

  } catch (err) {
    console.error("❌ Errore chatAttachment:", err);

    return {
      success: false,
      reply: "Errore durante l'elaborazione dell'allegato."
    };
  }
}

/* =========================================================
   ALIAS COMPATIBILITÀ FRONTEND
========================================================= */
async function attachment(req) {
  console.log("[DEBUG chatAttachment] alias attachment() → chatAttachment()");
  return chatAttachment(req);
}

/* =========================================================
   EXPORT — stile Java
========================================================= */
module.exports = {
  chatAttachment,
  attachment
};
