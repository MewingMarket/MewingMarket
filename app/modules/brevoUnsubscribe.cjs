const axios = require("axios");

/* =========================================================
   DISISCRIZIONE EMAIL DA BREVO (blindato)
========================================================= */
async function disiscriviEmail(email) {
  try {
    const apiKey = process.env.BREVO_API_KEY;

    if (!apiKey) {
      console.error("❌ disiscriviEmail: BREVO_API_KEY mancante");
      return { status: "error", message: "API key mancante" };
    }

    if (!email || typeof email !== "string") {
      console.error("❌ disiscriviEmail: email non valida:", email);
      return { status: "error", message: "Email non valida" };
    }

    const headers = {
      "api-key": apiKey,
      "Content-Type": "application/json"
    };

    const encoded = encodeURIComponent(email);

    /* =====================================================
       1️⃣ TENTATIVO DIRETTO: GET → PATCH
    ====================================================== */
    try {
      await axios.get(
        `https://api.brevo.com/v3/contacts/${encoded}`,
        { headers }
      );

      await axios.patch(
        `https://api.brevo.com/v3/contacts/${encoded}`,
        { emailBlacklisted: true },
        { headers }
      );

      console.log("📭 Disiscrizione via GET:", email);
      return { status: "ok" };
    } catch (err) {
      // silenzioso: passiamo allo step successivo
    }

    /* =====================================================
       2️⃣ TENTATIVO: POST → crea contatto già disiscritto
    ====================================================== */
    try {
      await axios.post(
        "https://api.brevo.com/v3/contacts",
        { email, emailBlacklisted: true },
        { headers }
      );

      console.log("📭 Contatto creato e disiscritto:", email);
      return { status: "ok" };
    } catch (err) {
      const code = err.response?.data?.code;

      if (code !== "duplicate_parameter") {
        console.error("❌ POST errore:", err.response?.data || err.message);
        return { status: "error", message: "Errore disiscrizione Brevo" };
      }
      // se è duplicate_parameter → passiamo allo step successivo
    }

    /* =====================================================
       3️⃣ SEARCH AVANZATA → trova ID → PATCH
    ====================================================== */
    try {
      const search = await axios.post(
        "https://api.brevo.com/v3/contacts/search",
        {
          filter: {
            email: { $contains: email }
          }
        },
        { headers }
      );

      const id = search.data?.contacts?.[0]?.id;

      if (id) {
        await axios.patch(
          `https://api.brevo.com/v3/contacts/${id}`,
          { emailBlacklisted: true },
          { headers }
        );

        console.log("📭 Disiscrizione via SEARCH avanzata:", email);
        return { status: "ok" };
      }
    } catch (err) {
      // silenzioso: passiamo allo step finale
    }

    /* =====================================================
       4️⃣ FALLBACK FINALE → crea contatto forzato
    ====================================================== */
    try {
      await axios.post(
        "https://api.brevo.com/v3/contacts",
        {
          email,
          emailBlacklisted: true,
          updateEnabled: true
        },
        { headers }
      );

      console.log("📭 Disiscrizione forzata:", email);
      return { status: "ok" };
    } catch (err) {
      console.error("❌ Errore finale disiscrizione:", err.response?.data || err.message);
      return { status: "error", message: "Errore finale disiscrizione" };
    }

  } catch (err) {
    console.error("❌ Errore disiscriviEmail (catch globale):", err.message);
    return { status: "error", message: "Errore interno disiscrizione" };
  }
}

module.exports = { disiscriviEmail };
