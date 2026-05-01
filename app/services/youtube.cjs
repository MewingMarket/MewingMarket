/**
 * =========================================================
 * File: app/services/youtube.cjs (SAFE MODE HARD)
 * Sync YouTube → aggiorna campi video nella tabella prodotti
 * + Aggiorna JSON mirror (products.json + youtube.json + catalog.json)
 * =========================================================
 */

const axios = require("axios");
const xml2js = require("xml2js");
const path = require("path");
const crypto = require("crypto");

// PATCH: require assoluti
const db = require(path.join(process.cwd(), "app/server/db/database.cjs"));
const jsonGen = require(path.join(process.cwd(), "app/server/modules/generatore-json.cjs"));

const PROXY = "https://corsproxy.io/?";

// =========================================================
// LIMITI DI SICUREZZA
// =========================================================
const MAX_FEED_SIZE = 3 * 1024 * 1024; // 3MB
const MAX_HTML_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_VIDEOS = 50;                 // massimo 50 video
const TIMEOUT_MS = 8000;               // timeout 8 secondi

// axios protetto
const http = axios.create({
  timeout: TIMEOUT_MS,
  maxContentLength: MAX_FEED_SIZE,
  maxBodyLength: MAX_FEED_SIZE,
  validateStatus: s => s >= 200 && s < 400
});

// =========================================================
// ID CANALE + FALLBACK
// =========================================================
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCojPlWkEtJmoG6Lsbx66Mtg";
const CHANNEL_USERNAME = "mewingmarket2";

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
   FUNZIONE: fuzzy match semplice
========================================================= */
function fuzzyMatch(a, b) {
  if (!a || !b) return false;
  a = a.toLowerCase();
  b = b.toLowerCase();
  return (
    a.includes(b) ||
    b.includes(a) ||
    a.replace(/\s+/g, "").includes(b.replace(/\s+/g, "")) ||
    b.replace(/\s+/g, "").includes(a.replace(/\s+/g, ""))
  );
}

/* =========================================================
   CONTROLLO TABELLA E COLONNE
========================================================= */
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
   SCRAPING RSS (SAFE)
========================================================= */
async function fetchChannelVideosRSS(channelId) {
  try {
    const url = `${PROXY}https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    console.log("🌐 RSS YouTube →", url);

    const res = await http.get(url);

    if (res.data.length > MAX_FEED_SIZE) {
      console.error("❌ RSS troppo grande. Skip.");
      return { success: false, videos: [] };
    }

    const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: true });

    const entries = parsed.feed?.entry || [];
    const videos = entries.slice(0, MAX_VIDEOS).map(e => ({
      videoId: e["yt:videoId"]?.[0],
      url: e.link?.[0]?.$.href,
      title: e.title?.[0] || "",
      description: e["media:group"]?.[0]?.["media:description"]?.[0] || "",
      thumbnail: e["media:group"]?.[0]?.["media:thumbnail"]?.[0]?.$.url || "",
      published: e.published?.[0] || null
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ RSS YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SCRAPING HTML (SAFE)
========================================================= */
async function safeHtmlScrape(url) {
  try {
    const res = await http.get(url);

    if (res.data.length > MAX_HTML_SIZE) {
      console.error("❌ HTML troppo grande. Skip.");
      return [];
    }

    const html = res.data;
    const regex = /"videoId":"(.*?)"/g;
    const ids = new Set();
    let match;

    while ((match = regex.exec(html)) !== null) {
      ids.add(match[1]);
      if (ids.size >= MAX_VIDEOS) break;
    }

    return [...ids].map(id => ({
      videoId: id,
      url: `https://www.youtube.com/watch?v=${id}`,
      title: "",
      description: "",
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: null
    }));

  } catch (err) {
    console.error("❌ HTML scrape fallito:", err?.message);
    return [];
  }
}

async function fetchChannelVideosHTML(channelId) {
  const url = `${PROXY}https://www.youtube.com/channel/${channelId}/videos`;
  console.log("🌐 HTML YouTube →", url);
  return { success: true, videos: await safeHtmlScrape(url) };
}

async function fetchByUsername(username) {
  const url = `${PROXY}https://www.youtube.com/@${username}/videos`;
  console.log("🌐 HTML Username →", url);
  return { success: true, videos: await safeHtmlScrape(url) };
}

async function fetchBySearchTerm(term) {
  const url = `${PROXY}https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`;
  console.log("🌐 Ricerca YouTube →", url);
  return { success: true, videos: await safeHtmlScrape(url) };
}

/* =========================================================
   SYNC COMPLETO (SAFE MODE HARD)
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato (SAFE)…");

  if (!tableExists("prodotti")) {
    console.error("❌ ERRORE: tabella 'prodotti' non trovata.");
    return { success: false, count: 0 };
  }

  // 1) RSS
  let result = await fetchChannelVideosRSS(CHANNEL_ID);

  // 2) HTML
  if (!result.success || !result.videos.length) {
    console.log("⚠️ RSS vuoto → provo HTML...");
    result = await fetchChannelVideosHTML(CHANNEL_ID);
  }

  // 3) Username
  if (!result.success || !result.videos.length) {
    console.log("⚠️ HTML vuoto → provo username...");
    result = await fetchByUsername(CHANNEL_USERNAME);
  }

  // 4) Ricerca fuzzy
  if (!result.success || !result.videos.length) {
    console.log("⚠️ Username vuoto → provo ricerca fuzzy...");
    result = await fetchBySearchTerm("mewingmarket2");
  }

  if (!result.success || !result.videos.length) {
    console.log("❌ Nessun video trovato via scraping.");
    return { success: false, count: 0 };
  }

  const videos = result.videos.slice(0, MAX_VIDEOS);

  // Ordina per data
  videos.sort((a, b) => {
    if (!a.published || !b.published) return 0;
    return new Date(b.published) - new Date(a.published);
  });

  const prodotti = db.prepare(`
    SELECT id, titolo, descrizione_lunga, youtube_video_id
    FROM prodotti
  `).all();

  const stmtUpdate = db.prepare(`
    UPDATE prodotti
    SET 
      youtube_url = ?,
      youtube_title = ?,
      youtube_description = ?,
      youtube_thumbnail = ?,
      youtube_video_id = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  let ok = 0;

  for (const p of prodotti) {
    let matched = null;

    matched = videos.find(v => v.videoId === p.youtube_video_id)
      || videos.find(v => fuzzyMatch(v.title, p.titolo))
      || videos.find(v => fuzzyMatch(v.description, p.descrizione_lunga))
      || videos.find(v =>
          fuzzyMatch(v.title, "mewing") ||
          fuzzyMatch(v.title, "market") ||
          fuzzyMatch(v.title, "business")
        );

    if (!matched) continue;

    stmtUpdate.run(
      matched.url,
      matched.title,
      matched.description,
      matched.thumbnail,
      matched.videoId,
      p.id
    );

    ok++;
  }

  console.log(`🎥 Sync YouTube completato (SAFE): ${ok} prodotti aggiornati.`);

  // MIRROR JSON
  try {
    await jsonGen.exportYouTube();
    await jsonGen.exportProducts();
    await jsonGen.exportCatalog();
    await jsonGen.exportCategories();
    console.log("💾 JSON aggiornati (SAFE).");
  } catch (err) {
    console.error("⚠️ Errore aggiornamento JSON:", err);
  }

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
