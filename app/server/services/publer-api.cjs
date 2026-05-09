/* =========================================================
   FILE: app/server/services/publer-api.cjs
   DESCRIZIONE:
   Wrapper Publer API — pubblicazione post e immagini
========================================================= */

async function publerPost({ text, imageUrl, profiles }) {
  if (!process.env.PUBLER_API_KEY) {
    console.log("⚠️ Publer disattivato: manca PUBLER_API_KEY");
    return { ok: false, skipped: true };
  }

  try {
    const payload = {
      caption: text,
      media: imageUrl ? [imageUrl] : [],
      profiles: profiles.filter(Boolean)
    };

    const res = await fetch("https://api.publer.io/v1/posts", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.PUBLER_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const json = await res.json();
    return json;

  } catch (err) {
    console.log("❌ Errore Publer:", err);
    return { ok: false, error: err };
  }
}

module.exports = { publerPost };
