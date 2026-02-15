// app/services/youtube.cjs — VERSIONE DEFINITIVA, CON API + RSS + HTML FALLBACK

const axios = require("axios");
const xml2js = require("xml2js");
const { updateFromYouTube } = require("../modules/youtube.cjs");
const { syncAirtable } = require("../modules/airtable.cjs");

/* =========================================================
   API YouTube
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
    console.error("❌ API YouTube fallita:", err?.response?.data || err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   RSS YouTube
========================================================= */
async function fetchChannelVideosRSS() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const entries = parsed.feed.entry || [];
    const list = Array.isArray(entries) ? entries : [entries];

    const videos = list
      .filter(e => e?.title)
      .map(e => {
        const href = e.link?.$.href || "";
        const videoId = href.split("v=")[1]?.split("&")[0] || "";

        return {
          videoId,
          url: href,
          title: e.title || "",
          description: e["media:group"]?.["media:description"] || "",
          thumbnail: e["media:group"]?.["media:thumbnail"]?.$.url || ""
        };
      });

    return { success: true, videos };

  } catch (err) {
    console.error("❌ RSS YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   FALLBACK HTML SCRAPING
========================================================= */
async function fetchChannelVideosHTML() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/channel/${channelId}/videos`;

    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
      }
    });

    const html = res.data;

    const match = html.match(/ytInitialData"\]\s*=\s*(\{.*?\});/s);
    if (!match) {
      console.log("❌ Nessun ytInitialData trovato nel fallback HTML.");
      return { success: false, videos: [] };
    }

    const json = JSON.parse(match[1]);

    const tabs = json.contents?.twoColumnBrowseResultsRenderer?.tabs;
    if (!tabs) return { success: false, videos: [] };

    const videoTab = tabs.find(t => t.tabRenderer?.title === "Videos");
    if (!videoTab) return { success: false, videos: [] };

    const items =
      videoTab.tabRenderer?.content?.richGridRenderer?.contents || [];

    const videos = [];

    for (const item of items) {
      const video = item.richItemRenderer?.content?.videoRenderer;
      if (!video) continue;

      const videoId = video.videoId;
      const title = video.title?.runs?.[0]?.text || "";
      const thumbnail =
        video.thumbnail?.thumbnails?.[video.thumbnail.thumbnails.length - 1]?.url;

      videos.push({
        videoId,
        url: `https://www.youtube.com/watch?v=${videoId}`,
        title,
        description: "",
        thumbnail
      });
    }

    return { success: true, videos };

  } catch (err) {
    console.error("❌ Fallback HTML YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO YOUTUBE
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  let result = await fetchChannelVideosAPI();

  if (!result.success || !result.videos.length) {
    console.log("⚠️ API YouTube fallita → uso RSS…");
    result = await fetchChannelVideosRSS();
  }

  if (!result.success || !result.videos.length) {
    console.log("⚠️ RSS fallito → uso fallback HTML…");
    result = await fetchChannelVideosHTML();
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

  await syncAirtable();

  console.log(`🎥 Sync YouTube completato: ${ok}/${videos.length} video aggiornati.`);

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
