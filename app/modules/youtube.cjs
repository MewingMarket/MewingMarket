// app/modules/youtube.cjs — VERSIONE DEFINITIVA, CON MATCH AUTOMATICO TRAMITE TITOLO

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
   NORMALIZZAZIONE TESTO
========================================================= */
function normalize(str) {
  return str
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/* =========================================================
   SIMILARITÀ TRA TITOLI (fuzzy match semplice)
========================================================= */
function similarity(a, b) {
  a = normalize(a);
  b = normalize(b);
  if (!a || !b) return 0;

  const wordsA = a.split(" ");
  const wordsB = b.split(" ");

  let matches = 0;
  for (const w of wordsA) {
    if (wordsB.includes(w)) matches++;
  }

  return matches / Math.max(wordsA.length, wordsB.length);
}

/* =========================================================
   TROVA RECORD IN AIRTABLE TRAMITE TITOLO VIDEO
========================================================= */
async function findRecordByTitle(videoTitle) {
  const url = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json"
    }
  });

  const data = await res.json();
  if (!data.records) return null;

  let best = null;
  let bestScore = 0;

  for (const r of data.records) {
    const productTitle = r.fields.Titolo || r.fields.titolo;
    if (!productTitle) continue;

    const score = similarity(videoTitle, productTitle);

    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }

  if (bestScore < 0.45) {
    console.log(`⏭️ Nessun match affidabile per video: "${videoTitle}" (score: ${bestScore})`);
    return null;
  }

  console.log(`🔍 Match trovato: "${videoTitle}" → "${best.fields.Titolo}" (score: ${bestScore})`);
  return best;
}

/* =========================================================
   AGGIORNA RECORD AIRTABLE
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
   UPDATE DA YOUTUBE — VERSIONE AUTOMATICA
========================================================= */
async function updateFromYouTube(video) {
  try {
    if (!video || !video.url) {
      console.log("⏭️ Nessun video valido ricevuto da YouTube.");
      return;
    }

    const record = await findRecordByTitle(video.title);

    if (!record) {
      console.log(`⏭️ Nessun prodotto trovato per video: "${video.title}"`);
      return;
    }

    console.log(`🎥 Aggiorno campi YouTube per prodotto: ${record.id}`);

    const fields = {
      youtube_url: video.url,
      youtube_title: video.title || "",
      youtube_description: video.description || "",
      youtube_thumbnail: video.thumbnail || "",
      youtube_last_video_url: video.url,
      youtube_last_video_title: video.title || ""
    };

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
