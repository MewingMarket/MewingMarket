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
   RSS YouTube
========================================================= */
async function fetchChannelVideosRSS() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const res = await axios.get(PROXY + encodeURIComponent(url), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml, { explicitArray: false });

    const entries = parsed.feed.entry || [];
    const list = Array.isArray(entries) ? entries : [entries];

    const videos = list.map(e => {
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
   FALLBACK HTML
========================================================= */
async function fetchChannelVideosHTML() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) return { success: false, videos: [] };

    const url = `https://www.youtube.com/channel/${channelId}/videos`;

    const res = await axios.get(PROXY + encodeURIComponent(url), {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const html = res.data;

    const match = html.match(/ytInitialData"\]\s*=\s*(\{.*?\});/s);
    if (!match) return { success: false, videos: [] };

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
    console.error("❌ HTML fallback fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO → aggiorna tabella prodotti
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  let result = await fetchChannelVideosAPI();
  if (!result.success || !result.videos.length) result = await fetchChannelVideosRSS();
  if (!result.success || !result.videos.length) result = await fetchChannelVideosHTML();

  const videos = result.videos || [];
  if (!videos.length) {
    console.log("❌ Nessun video trovato.");
    return { success: false, count: 0 };
  }

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

  let ok = 0;

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
