// app/server/modules/liste-brevo.cjs — SAFE MODE 2026.951

// =========================================================
// REQUIRE PROTETTO (evita crash se axios non è installato)
// =========================================================
let axios = null;
try {
  axios = require("axios");
} catch (err) {
  console.error("❌ axios non installato:", err.message);
}

// =========================================================
// CONFIG
// =========================================================
const BREVO_API_KEY = process.env.BREVO_API_KEY || null;
const BREVO_API_BASE = "https://api.brevo.com/v3";

// =========================================================
// LISTE BREVO
// =========================================================
const LISTA_NEWSLETTER = 8;
const LISTA_REGISTRATI = 9;
const LISTA_CREDENZIALI = 10;
const LISTA_CLIENTI = 12;
const LISTA_BACKUP = 14; // ⭐ nuova lista

function clean(email) {
  return String(email || "").trim().toLowerCase();
}

// =========================================================
// ADD TO LIST — SAFE MODE
// =========================================================
async function addToList(listId, email) {
  if (!axios) return;                 // PATCH
  if (!BREVO_API_KEY) return;         // PATCH
  if (!listId || !email) return;

  const e = clean(email);

  try {
    await axios.post(
      `${BREVO_API_BASE}/contacts`,
      { email: e, listIds: [listId] },
      { headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" } }
    );

  } catch (err) {
    const code = err?.response?.status;

    if (code === 400) {
      try {
        await axios.put(
          `${BREVO_API_BASE}/contacts/${encodeURIComponent(e)}`,
          { listIds: [listId] },
          { headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" } }
        );
      } catch (err2) {
        console.error("❌ Errore updateList:", err2?.response?.data || err2.message);
      }
      return;
    }

    console.error("❌ Errore addToList:", code, err?.response?.data || err.message);
  }
}

// =========================================================
// REMOVE FROM LIST — SAFE MODE
// =========================================================
async function removeFromList(listId, email) {
  if (!axios) return;                 // PATCH
  if (!BREVO_API_KEY) return;         // PATCH
  if (!listId || !email) return;

  const e = clean(email);

  try {
    await axios.delete(
      `${BREVO_API_BASE}/contacts/${encodeURIComponent(e)}/lists/${listId}`,
      { headers: { "api-key": BREVO_API_KEY, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const code = err?.response?.status;
    if (code === 404) return;
    console.error("❌ Errore removeFromList:", code, err?.response?.data || err.message);
  }
}

// =========================================================
// SYNC LISTS — SAFE MODE
// =========================================================
async function syncLists() {
  if (!axios) return { newsletter: [], clienti: [], backup: [] }; // PATCH
  if (!BREVO_API_KEY) return { newsletter: [], clienti: [], backup: [] };

  try {
    const resNL = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_NEWSLETTER}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    const resCL = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_CLIENTI}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    const resBK = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_BACKUP}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    return {
      newsletter: (resNL.data?.contacts || []).map(c => clean(c.email)),
      clienti: (resCL.data?.contacts || []).map(c => clean(c.email)),
      backup: (resBK.data?.contacts || []).map(c => clean(c.email))
    };

  } catch (err) {
    console.error("❌ Errore syncLists:", err?.response?.data || err.message);
    return { newsletter: [], clienti: [], backup: [] };
  }
}

// =========================================================
// GET STATO REALE — SAFE MODE
// =========================================================
async function getBrevoStatoRealeUtente(email) {
  if (!axios) return null;            // PATCH
  if (!BREVO_API_KEY || !email) return null;

  const e = clean(email);

  try {
    const res = await axios.get(
      `${BREVO_API_BASE}/contacts/${encodeURIComponent(e)}`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

    const data = res.data || {};

    return {
      cliente: (data.listIds || []).includes(LISTA_CLIENTI),
      newsletter: (data.listIds || []).includes(LISTA_NEWSLETTER),
      registrato: (data.listIds || []).includes(LISTA_REGISTRATI),
      credenziali: (data.listIds || []).includes(LISTA_CREDENZIALI),
      backup: (data.listIds || []).includes(LISTA_BACKUP)
    };

  } catch (err) {
    const code = err?.response?.status;
    if (code === 404) return null;
    console.error("❌ Errore getBrevoStatoRealeUtente:", err?.response?.data || err.message);
    return null;
  }
}

// =========================================================
// SYNC STATO REALE — SAFE MODE
// =========================================================
async function syncBrevoUtenteStatoReale({
  email,
  emailVecchia = null,
  registrato = null,
  cliente = null,
  newsletter = null,
  credenzialiModificate = null,
  backup = null,
  elimina = false
}) {
  if (!axios) return;                 // PATCH
  if (!BREVO_API_KEY) return;

  const e = clean(email);
  const old = emailVecchia ? clean(emailVecchia) : null;

  // Eliminazione totale
  if (elimina === true) {
    const liste = [
      LISTA_NEWSLETTER,
      LISTA_REGISTRATI,
      LISTA_CLIENTI,
      LISTA_CREDENZIALI,
      LISTA_BACKUP
    ];

    for (const L of liste) {
      await removeFromList(L, e);
      if (old) await removeFromList(L, old);
    }

    return;
  }

  // Cambio email
  if (old && old !== e) {
    const liste = [
      LISTA_NEWSLETTER,
      LISTA_REGISTRATI,
      LISTA_CLIENTI,
      LISTA_CREDENZIALI,
      LISTA_BACKUP
    ];

    for (const L of liste) {
      await removeFromList(L, old);
      await addToList(L, e);
    }
  }

  if (registrato === true) {
    await addToList(LISTA_REGISTRATI, e);
  }

  if (cliente === true) {
    await addToList(LISTA_CLIENTI, e);
    await addToList(LISTA_REGISTRATI, e);
  }

  if (cliente === false) {
    await removeFromList(LISTA_CLIENTI, e);
  }

  if (newsletter === true) {
    await addToList(LISTA_NEWSLETTER, e);
  }

  if (newsletter === false) {
    await removeFromList(LISTA_NEWSLETTER, e);
  }

  if (credenzialiModificate === true) {
    await addToList(LISTA_CREDENZIALI, e);
  }

  if (backup === true) {
    await addToList(LISTA_BACKUP, e);
  }

  if (backup === false) {
    await removeFromList(LISTA_BACKUP, e);
  }
}

// =========================================================
module.exports = {
  LISTA_NEWSLETTER,
  LISTA_REGISTRATI,
  LISTA_CREDENZIALI,
  LISTA_CLIENTI,
  LISTA_BACKUP,

  addToList,
  removeFromList,
  syncLists,
  syncBrevoUtenteStatoReale,
  getBrevoStatoRealeUtente
};