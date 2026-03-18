/**
 * =========================================================
 * File: app/services/youtube.cjs
 * Sync YouTube → aggiorna campi video nella tabella prodotti
 * + Aggiorna JSON mirror (products.json + youtube.json + catalog.json)
 * =========================================================
 */

const axios = require("axios");
const xml2js = require("xml2js");
const path = require("path");
const db = require(path.join(__dirname, "../server/db/database.cjs"));
const jsonGen = require("../server/modules/generatore-json.cjs");

const PROXY = "https://corsproxy.io/?";

// =========================================================
// ID CANALE + FALLBACK
// =========================================================
const CHANNEL_ID = process.env.YOUTUBE_CHANNEL_ID || "UCojPlWkEtJmoG6Lsbx66Mtg";
const CHANNEL_USERNAME = "mewingmarket2";
const CHANNEL_URL = "https://www.youtube.com/@mewingmarket2";

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
   SCRAPING RSS
========================================================= */
async function fetchChannelVideosRSS(channelId) {
  try {
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
   SCRAPING HTML
========================================================= */
async function fetchChannelVideosHTML(channelId) {
  try {
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
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: null
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ HTML YouTube fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   FALLBACK: Username
========================================================= */
async function fetchByUsername(username) {
  try {
    const url = `${PROXY}https://www.youtube.com/@${username}/videos`;
    console.log("🌐 HTML Username →", url);

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
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: null
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ HTML Username fallito:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   FALLBACK: Ricerca fuzzy
========================================================= */
async function fetchBySearchTerm(term) {
  try {
    const url = `${PROXY}https://www.youtube.com/results?search_query=${encodeURIComponent(term)}`;
    console.log("🌐 Ricerca YouTube →", url);

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
      thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
      published: null
    }));

    return { success: true, videos };

  } catch (err) {
    console.error("❌ Ricerca YouTube fallita:", err?.message);
    return { success: false, videos: [] };
  }
}

/* =========================================================
   SYNC COMPLETO
========================================================= */
async function syncYouTube() {
  console.log("⏳ Sync YouTube avviato...");

  if (!tableExists("prodotti")) {
    console.error("❌ ERRORE: tabella 'prodotti' non trovata.");
    return { success: false, count: 0 };
  }

  // 1) Tentativo con ID canale
  let result = await fetchChannelVideosRSS(CHANNEL_ID);

  // 2) Fallback HTML
  if (!result.success || !result.videos.length) {
    console.log("⚠️ RSS vuoto → provo HTML...");
    result = await fetchChannelVideosHTML(CHANNEL_ID);
  }

  // 3) Fallback username
  if (!result.success || !result.videos.length) {
    console.log("⚠️ HTML vuoto → provo username...");
    result = await fetchByUsername(CHANNEL_USERNAME);
  }

  // 4) Fallback ricerca fuzzy
  if (!result.success || !result.videos.length) {
    console.log("⚠️ Username vuoto → provo ricerca fuzzy...");
    result = await fetchBySearchTerm("mewingmarket2");
  }

  if (!result.success || !result.videos.length) {
    console.log("❌ Nessun video trovato via scraping.");
    return { success: false, count: 0 };
  }

  // Ordina per data (se disponibile)
  result.videos.sort((a, b) => {
    if (!a.published || !b.published) return 0;
    return new Date(b.published) - new Date(a.published);
  });

  const videos = result.videos;

  const stmtFind = db.prepare(`
    SELECT id, titolo, descrizione_lunga
    FROM prodotti
  `);

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

  const prodotti = stmtFind.all();

  for (const p of prodotti) {
    let matched = null;

    // 1) match diretto su videoId
    matched = videos.find(v => v.videoId === p.youtube_video_id);

    // 2) match fuzzy su titolo
    if (!matched) {
      matched = videos.find(v => fuzzyMatch(v.title, p.titolo));
    }

    // 3) match fuzzy su descrizione
    if (!matched) {
      matched = videos.find(v => fuzzyMatch(v.description, p.descrizione_lunga));
    }

    // 4) match su parole chiave
    if (!matched) {
      matched = videos.find(v =>
        fuzzyMatch(v.title, "mewing") ||
        fuzzyMatch(v.title, "market") ||
        fuzzyMatch(v.title, "business")
      );
    }

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

  console.log(`🎥 Sync YouTube completato: ${ok} prodotti aggiornati.`);

  // 🔥 MIRROR JSON AUTOMATICO
  try {
    await jsonGen.exportYouTube();
    await jsonGen.exportProducts();
    await jsonGen.exportCatalog();
    await jsonGen.exportCategories();
    console.log("💾 JSON YouTube + prodotti + catalogo + categorie aggiornati.");
  } catch (err) {
    console.error("⚠️ Errore aggiornamento JSON:", err);
  }

  return { success: true, count: ok };
}

module.exports = {
  syncYouTube
};
