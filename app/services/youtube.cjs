// app/services/youtube.cjs — API + RSS + HTML FALLBACK + PROXY + LOG AVANZATI

const axios = require("axios");
const xml2js = require("xml2js");
const { updateFromYouTube } = require("../modules/youtube.cjs");

// ❌ RIMOSSO: syncAirtable non deve essere chiamato da YouTube
// const { syncAirtable } = require("../modules/airtable.cjs");

const PROXY = "https://corsproxy.io/?";

// Credenziali Airtable (per sicurezza)
const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const AIRTABLE_BASE = process.env.AIRTABLE_BASE;
const AIRTABLE_TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

function canUseAirtable() {
  if (!AIRTABLE_PAT || !AIRTABLE_BASE || !AIRTABLE_TABLE_NAME) {
    console.log("⏭️ YouTube → Airtable skipped: missing PAT / BASE / TABLE_NAME");
    return false;
  }
  return true;
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

    const url = `https://www.googleapis.com/youtube/v3/search?key=${apiKey}&channelId=${channelId}&part=snippet&order=date&maxResults=10`;

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

    console.log("📥 API YouTube ha trovato:", videos.length, "video");

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

    console.log("🌐 RSS YouTube →", url);

    const res = await axios.get(PROXY + encodeURIComponent(url), {
      headers: { "User-Agent": "Mozilla/5.0" }
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

    console.log("📥 RSS ha trovato:", videos.length, "video");

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

    console.log("🌐 HTML Fallback →", url);

    const res = await axios.get(PROXY + encodeURIComponent(url), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = res.data;

    const match = html.match(/ytInitialData"\]\s*=\s*(\{.*?\});/s);
    if (!match) {
      console.log("❌ Nessun ytInitialData trovato.");
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

    console.log("📥 HTML fallback ha trovato:", videos.length, "video");

    return { success: true, videos };

  } catch (err) {
    console.error("❌ Fallback HTML fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO YOUTUBE (RESILIENTE)
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  let result = await fetchChannelVideosAPI();

  if (!result.success || !result.videos.length) {
    console.log("⚠️ API fallita → uso RSS…");
    result = await fetchChannelVideosRSS();
  }

  if (!result.success || !result.videos.length) {
    console.log("⚠️ RSS fallito → uso HTML fallback…");
    result = await fetchChannelVideosHTML();
  }

  const videos = result.videos || [];

  if (!videos.length) {
    console.log("❌ Nessun video trovato da nessuna fonte.");
    return { success: false, count: 0 };
  }

  let ok = 0;

  for (const video of videos) {
    try {
      if (canUseAirtable()) {
        await updateFromYouTube(video);
      } else {
        console.log("⏭️ Skip updateFromYouTube: Airtable non configurato");
      }
      ok++;
    } catch (err) {
      console.error("Errore updateFromYouTube:", err);
    }
  }

  // ❌ RIMOSSO: YouTube NON deve fare sync globale Airtable
  // await syncAirtable();

  console.log(`🎥 Sync YouTube completato: ${ok}/${videos.length} video aggiornati.`);

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
