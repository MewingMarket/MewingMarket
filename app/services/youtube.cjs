// app/services/youtube.cjs — SERVIZIO COMPLETO

const axios = require("axios");
const { updateFromYouTube } = require("../modules/youtube.cjs");

/* =========================================================
   FETCH ULTIMI VIDEO DEL CANALE
========================================================= */
async function fetchChannelVideos() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL;
    const apiKey = process.env.YOUTUBE_API_KEY;

    if (!channelId || !apiKey) {
      console.error("YouTube: variabili ambiente mancanti.");
      return [];
    }

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=10`;

    const res = await axios.get(url);
    const items = res.data?.items || [];

    return items.map(v => ({
      url: `https://www.youtube.com/watch?v=${v.id.videoId}`,
      title: v.snippet.title,
      description: v.snippet.description,
      thumbnail: v.snippet.thumbnails?.high?.url || ""
    }));

  } catch (err) {
    console.error("❌ Errore fetchChannelVideos:", err?.response?.data || err);
    return [];
  }
}

/* =========================================================
   SYNC YOUTUBE → AIRTABLE
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  const videos = await fetchChannelVideos();

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
