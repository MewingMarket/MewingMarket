// app/server/modules/liste-brevo.cjs
const axios = require("axios");

const BREVO_API_KEY = process.env.BREVO_API_KEY;
const BREVO_API_BASE = "https://api.brevo.com/v3";

// =========================================================
// LISTE BREVO
// =========================================================
const LISTA_NEWSLETTER = 8;
const LISTA_REGISTRATI = 9;
const LISTA_CREDENZIALI = 10;
const LISTA_CLIENTI = 12;

// =========================================================
// NORMALIZZAZIONE EMAIL
// =========================================================
function clean(email) {
  return String(email || "").trim().toLowerCase();
}

// =========================================================
// AGGIUNTA A LISTA
// =========================================================
async function addToList(listId, email) {
  if (!BREVO_API_KEY || !listId || !email) return;

  const e = clean(email);

  try {
    await axios.post(
      `${BREVO_API_BASE}/contacts`,
      {
        email: e,
        listIds: [listId]
      },
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    const code = err?.response?.status;

    // 400 = contatto già esistente → OK
    if (code === 400) return;

    console.error("❌ Errore addToList:", code, err?.response?.data || err.message);
  }
}

// =========================================================
// RIMOZIONE DA LISTA
// =========================================================
async function removeFromList(listId, email) {
  if (!BREVO_API_KEY || !listId || !email) return;

  const e = clean(email);

  try {
    await axios.delete(
      `${BREVO_API_BASE}/contacts/${encodeURIComponent(e)}/lists/${listId}`,
      {
        headers: {
          "api-key": BREVO_API_KEY,
          "Content-Type": "application/json"
        }
      }
    );
  } catch (err) {
    const code = err?.response?.status;

    // 404 = contatto non presente → OK
    if (code === 404) return;

    console.error("❌ Errore removeFromList:", code, err?.response?.data || err.message);
  }
}

// =========================================================
// ⭐ PATCH — SYNC LISTE COMPLETO (newsletter + clienti)
// =========================================================
async function syncLists() {
  if (!BREVO_API_KEY) return { newsletter: [], clienti: [] };

  try {
    // NEWSLETTER
    const resNL = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_NEWSLETTER}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    // CLIENTI
    const resCL = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_CLIENTI}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    return {
      newsletter: (resNL.data?.contacts || []).map(c => clean(c.email)),
      clienti: (resCL.data?.contacts || []).map(c => clean(c.email))
    };

  } catch (err) {
    console.error("❌ Errore syncLists:", err?.response?.data || err.message);
    return { newsletter: [], clienti: [] };
  }
}

// =========================================================
// EXPORT
// =========================================================
module.exports = {
  LISTA_NEWSLETTER,
  LISTA_REGISTRATI,
  LISTA_CREDENZIALI,
  LISTA_CLIENTI,

  addToList,
  removeFromList,
  syncLists
};
