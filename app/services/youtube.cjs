// app/services/youtube.cjs — SERVIZIO COMPLETO CON FALLBACK RSS

const axios = require("axios");
const { updateFromYouTube } = require("../modules/youtube.cjs");

/* =========================================================
   1) FETCH ULTIMI VIDEO VIA API (può fallire)
========================================================= */
async function fetchChannelVideosAPI() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || !apiKey) {
      console.error("YouTube: variabili ambiente mancanti.");
      return { success: false, videos: [] };
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=10`;

    const res = await axios.get(url);
    const items = res.data?.items || [];

    const videos = items.map(v => ({
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails?.high?.url || ""
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ API YouTube fallita:", err?.response?.data || err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   2) FALLBACK RSS (sempre funzionante)
========================================================= */
async function fetchChannelVideosRSS() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const res = await axios.get(url);

    const xml = res.data;
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];

    const videos = entries.map(entry => {
      const block = entry[1];

      return {
        url: block.match(/<link rel="alternate" href="(.*?)"/)?.[1],
        title: block.match(/<title>(.*?)<\/title>/)?.[1],
        description: block.match(/<media:description>([\s\S]*?)<\/media:description>/)?.[1] || "",
        thumbnail: block.match(/<media:thumbnail url="(.*?)"/)?.[1] || ""
      };
    });

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
