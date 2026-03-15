/**
 * =========================================================
 * File: app/services/youtube.cjs
 * Sync YouTube → aggiorna campi video nella tabella prodotti
 * SOLO SCRAPING (RSS + HTML) — NESSUNA API
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

  const patterns = [
    /v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /shorts\/([^?]+)/,
    /embed\/([^?]+)/
  ];

  for (const p of patterns) {
    const match = url.match(p);
    if (match) return match[1];
  }

  return null;
}

/* =========================================================
   CONTROLLO TABELLA E COLONNE
========================================================= */
function tableHasColumn(table, column) {
  try {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    return info.some(c => c.name === column);
  } catch {
    return false;
  }
}

function tableExists(table) {
  try {
    const row = db.prepare(
      `SELECT name FROM sqlite_master WHERE type='table' AND name=?`
    ).get(table);
    return !!row;
  } catch {
    return false;
  }
}

/* =========================================================
   SCRAPING RSS (feed ufficiale YouTube)
========================================================= */
async function fetchChannelVideosRSS() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      console.error("❌ RSS: manca YOUTUBE_CHANNEL_ID");
      return { success: false, videos: [] };
    }

    const url = `${PROXY}https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    console.log("🌐 RSS YouTube →", url);

    const res = await axios.get(url);
    const parsed = await xml2js.parseStringPromise(res.data);

    const entries = parsed.feed.entry || [];

    const videos = entries.map(e => ({
      videoId: e["yt:videoId"][0],
      url: e.link[0].$.href,
      title: e.title[0],
      description: e["media:group"]?.[0]?.["media:description"]?.[0] || "",
      thumbnail: e["media:group"]?.[0]?.["media:thumbnail"]?.[0]?.$.url || ""
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ RSS YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SCRAPING HTML (fallback finale)
========================================================= */
async function fetchChannelVideosHTML() {
  try {
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) {
      console.error("❌ HTML: manca YOUTUBE_CHANNEL_ID");
      return { success: false, videos: [] };
    }

    const url = `${PROXY}https://www.youtube.com/channel/${channelId}/videos`;
    console.log("🌐 HTML YouTube →", url);

    const res = await axios.get(url);
    const html = res.data;

    const regex = /"videoId":"(.*?)"/g;
    const ids = new Set();
    let match;

    while ((match = regex.exec(html)) !== null) {
      ids.add(match[1]);
    }

    const videos = [...ids].map(id => ({
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: "",
      description: "",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ HTML YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO → aggiorna tabella prodotti
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  // 🔒 Controllo tabella
  if (!tableExists("prodotti")) {
    console.error("❌ ERRORE: tabella 'prodotti' non trovata.");
    return { success: false, count: 0 };
  }

  // 🔒 Controllo colonna id
  if (!tableHasColumn("prodotti", "id")) {
    console.error("❌ ERRORE: la tabella 'prodotti' non ha colonna 'id'.");
    return { success: false, count: 0 };
  }

  // 🔒 Controllo colonna youtube_video_id
  if (!tableHasColumn("prodotti", "youtube_video_id")) {
    console.error("❌ ERRORE: manca colonna youtube_video_id.");
    return { success: false, count: 0 };
  }

  // 1) RSS
  let result = await fetchChannelVideosRSS();

  // 2) Fallback HTML
  if (!result.success || !result.videos.length) {
    console.log("⚠️ RSS vuoto → provo HTML...");
    result = await fetchChannelVideosHTML();
  }

  if (!result.success || !result.videos.length) {
    console.log("❌ Nessun video trovato via scraping.");
    return { success: false, count: 0 };
  }

  const videos = result.videos;

  const stmtFind = db.prepare(`
    SELECT id FROM prodotti WHERE youtube_video_id = ?
  `);

  const stmtUpdate = db.prepare(`
    UPDATE prodotti
    SET 
      youtube_url = ?,
      youtube_title = ?,
      youtube_description = ?,
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

  const prodotti = db.prepare("SELECT id, youtube_url, youtube_video_id FROM prodotti").all();

  // 1) Estrai ID mancanti
  for (const p of prodotti) {
    if (!p.youtube_video_id && p.youtube_url) {
      const extracted = extractVideoId(p.youtube_url);
      if (extracted) {
        stmtFixMissing.run(extracted, p.id);
        console.log(`🔧 Aggiunto youtube_video_id per prodotto ${p.id}: ${extracted}`);
      }
    }
  }

  // 2) Aggiorna prodotti
  for (const v of videos) {
    const prod = stmtFind.get(v.videoId);
    if (!prod) continue;

    stmtUpdate.run(
      v.url,
      v.title,
      v.description,
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
