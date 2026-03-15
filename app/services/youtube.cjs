/**
 * =========================================================
 * File: app/services/youtube.cjs
 * Sync YouTube → aggiorna campi video nella tabella prodotti
 * =========================================================
 */

const axios = require("axios");
const xml2js = require("xml2js");
const path = require("path");
const db = require(path.join(__dirname, "../server/db/database.cjs"));

const PROXY = "https://corsproxy.io/?";

/* =========================================================
   FUNZIONE: Estrae ID da qualsiasi URL YouTube
========================================================= */
function extractVideoId(url) {
  if (!url) return null;

  // Formati supportati:
  // https://www.youtube.com/watch?v=ID
  // https://youtu.be/ID
  // https://www.youtube.com/shorts/ID
  // https://youtube.com/embed/ID

  const patterns = [
    /v=([^&]+)/,                // watch?v=ID
    /youtu\.be\/([^?]+)/,       // youtu.be/ID
    /shorts\/([^?]+)/,          // shorts/ID
    /embed\/([^?]+)/            // embed/ID
  ];

  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }

  return null;
}

/* =========================================================
   API YouTube
========================================================= */
async function fetchChannelVideosAPI() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || !apiKey) {
      console.error("❌ API YouTube: variabili ambiente mancanti.");
      return { success: false, videos: [] };
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=20`;

    console.log("🌐 API YouTube →", url);

    const res = await axios.get(url);
    const items = res.data?.items || [];

    const videos = items
      .filter(v => v.id?.videoId)
      .map(v => ({
        videoId: v.id.videoId,
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
        title: v.snippet.title || "",
        description: v.snippet.description || "",
        thumbnail: v.snippet.thumbnails?.high?.url || ""
      }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ API YouTube fallita:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO → aggiorna tabella prodotti
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  let result = await fetchChannelVideosAPI();
  if (!result.success || !result.videos.length) {
    console.log("❌ Nessun video trovato via API.");
    return { success: false, count: 0 };
  }

  const videos = result.videos;

  // Prepara statement SQL
  const stmtFind = db.prepare(`
    SELECT id FROM prodotti WHERE youtube_video_id = ?
  `);

  const stmtUpdate = db.prepare(`
    UPDATE prodotti
    SET 
      youtube_url = ?,
      youtube_title = ?,
      youtube_thumbnail = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const stmtFixMissing = db.prepare(`
    UPDATE prodotti
    SET youtube_video_id = ?
    WHERE id = ?
  `);

  let ok = 0;

  // Recupera tutti i prodotti
  const prodotti = db.prepare("SELECT id, youtube_url, youtube_video_id FROM prodotti").all();

  // 1) Prima fase: estrai ID mancanti
  for (const p of prodotti) {
    if (!p.youtube_video_id && p.youtube_url) {
      const extracted = extractVideoId(p.youtube_url);
      if (extracted) {
        stmtFixMissing.run(extracted, p.id);
        console.log(`🔧 Aggiunto youtube_video_id per prodotto ${p.id}: ${extracted}`);
      }
    }
  }

  // 2) Seconda fase: aggiorna i prodotti con video trovati
  for (const v of videos) {
    const prod = stmtFind.get(v.videoId);
    if (!prod) continue;

    stmtUpdate.run(
      v.url,
      v.title,
      v.thumbnail,
      prod.id
    );

    ok++;
  }

  console.log(`🎥 Sync YouTube completato: ${ok} prodotti aggiornati.`);

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
