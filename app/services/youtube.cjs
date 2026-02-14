// app/services/youtube.cjs — SERVIZIO COMPLETO CON FALLBACK RSS ROBUSTO

const axios = require("axios");
const xml2js = require("xml2js");
const { updateFromYouTube } = require("../modules/youtube.cjs");

/* =========================================================
   1) FETCH ULTIMI VIDEO VIA API (può fallire)
========================================================= */
async function fetchChannelVideosAPI() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || !apiKey) {
      console.error("YouTube: variabili ambiente mancanti.");
      return { success: false, videos: [] };
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=10`;

    const res = await axios.get(url);
    const items = res.data?.items || [];

    const videos = items
      .filter(v => v.id?.videoId) // evita risultati non-video
      .map(v => ({
        url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
        title: v.snippet.title || "",
        description: v.snippet.description || "",
        thumbnail: v.snippet.thumbnails?.high?.url || ""
      }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ API YouTube fallita:", err?.response?.data || err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   2) FALLBACK RSS (parser XML robusto)
========================================================= */
async function fetchChannelVideosRSS() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await axios.get(url);

    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const entries = parsed.feed.entry || [];
    const list = Array.isArray(entries) ? entries : [entries];

    const videos = list
      .filter(e => e?.title) // evita entry vuote
      .map(e => ({
        url: e.link?.$.href || "",
        title: e.title || "",
        description: e["media:group"]?.["media:description"] || "",
        thumbnail: e["media:group"]?.["media:thumbnail"]?.$.url || ""
      }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ RSS YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   3) SYNC COMPLETO (API → RSS)
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  // 1) Tentativo API
  let result = await fetchChannelVideosAPI();

  // 2) Se API fallisce → fallback RSS
  if (!result.success || !result.videos.length) {
    console.log("⚠️ API YouTube fallita → uso RSS…");
    result = await fetchChannelVideosRSS();
  }

  const videos = result.videos || [];

  if (!videos.length) {
    console.log("YouTube: nessun video trovato.");
    return { success: false, count: 0 };
  }

  let ok = 0;

  for (const video of videos) {
    try {
      await updateFromYouTube(video);
      ok++;
    } catch (err) {
      console.error("Errore updateFromYouTube:", err);
    }
  }

  console.log(`🎥 Sync YouTube completato: ${ok}/${videos.length} video aggiornati.`);

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
