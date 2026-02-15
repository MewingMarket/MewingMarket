// modules/youtube.cjs — VERSIONE DEFINITIVA, PATCHATA E FUNZIONANTE

const fetch = require("node-fetch");

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE;
const TABLE_NAME = process.env.AIRTABLE_TABLE_NAME;

/* =========================================================
   Campi YouTube ammessi in Airtable
========================================================= */
const YT_FIELDS = [
  "youtube_url",
  "youtube_title",
  "youtube_description",
  "youtube_thumbnail",
  "youtube_last_video_url",
  "youtube_last_video_title"
];

/* =========================================================
   Trova record per YouTubeVideoID
   (campo da creare in Airtable)
========================================================= */
async function findRecordByVideoId(videoId) {
  const formula = encodeURIComponent(`{YouTubeVideoID} = "${videoId}"`);
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}?filterByFormula=${formula}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  return data.records?.[0] || null;
}

/* =========================================================
   Aggiorna record Airtable
========================================================= */
async function updateRecord(id, fields) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}/${id}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ fields })
  });

  const data = await res.json();
  if (data.error) {
    console.error("❌ Errore updateRecord YouTube:", data.error);
  }
}

/* =========================================================
   UPDATE DA YOUTUBE — VERSIONE DEFINITIVA
========================================================= */
async function updateFromYouTube(video) {
  try {
    if (!video || !video.url) {
      console.log("⏭️ Nessun video valido ricevuto da YouTube.");
      return;
    }

    // 🔍 Estrai videoId (se non già presente)
    let videoId = video.videoId;
    if (!videoId) {
      videoId = video.url.split("v=")[1]?.split("&")[0] || "";
    }

    if (!videoId) {
      console.log("⏭️ Video senza ID valido:", video.url);
      return;
    }

    // 🔥 Cerchiamo il prodotto corrispondente tramite YouTubeVideoID
    const record = await findRecordByVideoId(videoId);

    if (!record) {
      console.log(`⏭️ Nessun prodotto con YouTubeVideoID "${videoId}" trovato in Airtable.`);
      return;
    }

    console.log(`🎥 Aggiorno campi YouTube per prodotto: ${record.id}`);

    // Campi YouTube da aggiornare
    const fields = {
      youtube_url: video.url,
      youtube_title: video.title || "",
      youtube_description: video.description || "",
      youtube_thumbnail: video.thumbnail || "",
      youtube_last_video_url: video.url,
      youtube_last_video_title: video.title || ""
    };

    // 🔒 Non sovrascrivere con valori vuoti
    const safeFields = {};
    for (const key of YT_FIELDS) {
      if (fields[key] && fields[key].toString().trim() !== "") {
        safeFields[key] = fields[key];
      }
    }

    await updateRecord(record.id, safeFields);

  } catch (err) {
    console.error("❌ updateFromYouTube:", err);
  }
}

module.exports = {
  updateFromYouTube
};
