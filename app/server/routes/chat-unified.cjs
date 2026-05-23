/* =========================================================
   FILE: app/server/routes/chat-unified.cjs
   MODALITÀ: Java‑mode (funzione singola, no Express)
   DESCRIZIONE:
   Router unificato per:
   - /api/chat           (testo)
   - /api/chat/voice     (audio → testo)
   - /api/chat/attachment (file)
========================================================= */

const fs = require("fs");
const path = require("path");

// BOT ENGINE 2027
const { handleConversation } = require(path.join(process.cwd(), "app/modules/bot/index.cjs"));
const { generateIntent } = require(path.join(process.cwd(), "app/modules/bot/intent-engine.cjs"));
const missionEngine = require(path.join(process.cwd(), "app/modules/game/mission-engine.cjs"));
const { createTutorialForGuide } = require(path.join(process.cwd(), "app/modules/tutorials.cjs"));
const { getCachedTutorial, setCachedTutorial } = require(path.join(process.cwd(), "app/server/modules/video-cache.cjs"));

// AUDIO
const { transcribeAudio } = require(path.join(process.cwd(), "app/modules/audio.cjs"));

// GA4
const { trackGA4 } = require(path.join(process.cwd(), "app/server/services/ga4.cjs"));

/* =========================================================
   NORMALIZZATORE RISPOSTA → FORMATO UNICO PER IL FRONTEND
========================================================= */
function normalizeReply(finalReply, fallbackAvatar) {
  const safe = finalReply || {};

  const type = safe.type || "text";
  const avatar = safe.avatar || fallbackAvatar;

  const base = { success: true, type, avatar };

  if (type === "video") {
    return { ...base, url: safe.url || "" };
  }

  if (type === "mission") {
    return { ...base, blocks: Array.isArray(safe.blocks) ? safe.blocks : [] };
  }

  return { ...base, text: safe.text || safe.reply || "" };
}

/* =========================================================
   FUNZIONE UNICA: chatUnified(req, mode)
   mode = "text" | "voice" | "attachment"
========================================================= */
async function chatUnified(req, mode = "text") {
  const uid = req.uid;
  const botAvatar = req.body?.bot || "generic";
  const gender = req.body?.gender || "male";

  try {
    if (!global.catalogReady) {
      return {
        success: true,
        type: "text",
        text: "Sto pensando… un attimo 😄",
        delay: true,
        avatar: botAvatar
      };
    }

    let message = req.body?.message || "";

    /* =====================================================
       1) MODE: VOCE → trascrizione
    ====================================================== */
    if (mode === "voice") {
      const uploadDir = path.join(process.cwd(), "app/public/uploads");
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = "voice_" + Date.now() + ".webm";
      const filePath = path.join(uploadDir, filename);

      await new Promise((resolve, reject) => {
        const ws = fs.createWriteStream(filePath);
        req.pipe(ws);
        ws.on("finish", resolve);
        ws.on("error", reject);
      });

      message = await transcribeAudio(filePath);
      fs.unlinkSync(filePath);
    }

    /* =====================================================
       2) MODE: ATTACHMENT → prepara req.attachment
    ====================================================== */
    if (mode === "attachment") {
      const file = req.file;
      if (!file) return { success: false, error: "Nessun file ricevuto" };

      req.attachment = {
        path: file.path,
        originalName: file.originalname,
        mime: file.mimetype,
        size: file.size
      };

      message = "file";
    }

    /* =====================================================
       3) INTENT ENGINE
    ====================================================== */
    const intentData = await generateIntent(message, { botAvatar, gender });
    const resolvedAvatar = intentData?.avatar || botAvatar;
    const intentName = intentData?.intent || "unknown";

    const isGuide = intentData?.intent === "guida" && intentData?.tutorial?.guideKey;
    const isTutorialProdotto = intentData?.intent === "tutorial_prodotto";

    /* =====================================================
       4) TUTORIAL GUIDA → VIDEO
    ====================================================== */
    if (isGuide) {
      const guideKey = intentData.tutorial.guideKey;
      const guideText = intentData.tutorial.guideText;

      const cacheKey = `${guideKey}:${botAvatar}:${gender}`;
      let videoUrl = getCachedTutorial(cacheKey);

      if (!videoUrl) {
        videoUrl = await createTutorialForGuide(guideKey, guideText, botAvatar, gender);
        setCachedTutorial(cacheKey, videoUrl);
      }

      return {
        success: true,
        type: "video",
        url: videoUrl,
        avatar: resolvedAvatar
      };
    }

    /* =====================================================
       5) BOT ENGINE (risposta normale)
    ====================================================== */
    req.body.message = message;
    req.body.bot = botAvatar;
    req.body.gender = gender;

    const finalReply = await handleConversation(req);

    /* =====================================================
       6) MISSION ENGINE
    ====================================================== */
    const missionResult = await missionEngine.processEvent({
      uid,
      intent: intentName,
      botAvatar
    });

    if (missionResult) {
      if (missionResult.xpEarned > 0) {
        finalReply.type = "mission";
        finalReply.blocks = finalReply.blocks || [];
        finalReply.blocks.unshift({
          title: "✨ XP guadagnati",
          text: `+${missionResult.xpEarned} XP`
        });
      }

      if (missionResult.levelUp) {
        finalReply.type = "mission";
        finalReply.blocks = finalReply.blocks || [];
        finalReply.blocks.unshift({
          title: "🎉 Livello aumentato!",
          text: `Sei ora livello ${missionResult.levelUp.newLevel}`
        });
      }

      if (missionResult.completedMissions?.length) {
        finalReply.type = "mission";
        finalReply.blocks = finalReply.blocks || [];
        missionResult.completedMissions.forEach(m => {
          finalReply.blocks.unshift({
            title: "🏆 Missione completata!",
            text: m.title || m.mission_key
          });
        });
      }
    }

    /* =====================================================
       7) NORMALIZZA RISPOSTA
    ====================================================== */
    return normalizeReply(finalReply, resolvedAvatar);

  } catch (err) {
    console.error("❌ Errore chatUnified:", err);
    return {
      success: false,
      type: "text",
      text: "Si è verificato un errore. Riprova tra qualche secondo.",
      error: true
    };
  }
}

/* =========================================================
   EXPORT — 3 ENDPOINT
========================================================= */
module.exports = {
  chat: (req) => chatUnified(req, "text"),
  chatVoice: (req) => chatUnified(req, "voice"),
  chatAttachment: (req) => chatUnified(req, "attachment")
};
