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
function clean(email) {
  return String(email || "").trim().toLowerCase();
}

// =========================================================
// ⭐ PATCH 2026.950 — addToList con fallback PUT se il contatto esiste
// =========================================================
async function addToList(listId, email) {
  if (!BREVO_API_KEY || !listId || !email) return;

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
async function removeFromList(listId, email) {
  if (!BREVO_API_KEY || !listId || !email) return;

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
async function syncLists() {
  if (!BREVO_API_KEY) return { newsletter: [], clienti: [] };

  try {
    const resNL = await axios.get(
      `${BREVO_API_BASE}/contacts/lists/${LISTA_NEWSLETTER}/contacts`,
      { headers: { "api-key": BREVO_API_KEY } }
    );

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
// ⭐ PATCH 2026 — GET STATO REALE UTENTE (NO-OP INTELLIGENTE)
// =========================================================
async function getBrevoStatoRealeUtente(email) {
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
      credenziali: (data.listIds || []).includes(LISTA_CREDENZIALI)
    };

  } catch (err) {
    const code = err?.response?.status;
    if (code === 404) return null;
    console.error("❌ Errore getBrevoStatoRealeUtente:", err?.response?.data || err.message);
    return null;
  }
}

// =========================================================
// ⭐ FUNZIONE CENTRALE — SYNC STATO REALE UTENTE
// =========================================================
async function syncBrevoUtenteStatoReale({
  email,
  emailVecchia = null,
  registrato = null,
  cliente = null,
  newsletter = null,
  credenzialiModificate = null,
  elimina = false
}) {
  if (!BREVO_API_KEY) return;

  const e = clean(email);
  const old = emailVecchia ? clean(emailVecchia) : null;

  // =========================================================
  // ⭐ Eliminazione totale da tutte le liste
  // =========================================================
  if (elimina === true) {
    const liste = [
      LISTA_NEWSLETTER,
      LISTA_REGISTRATI,
      LISTA_CLIENTI,
      LISTA_CREDENZIALI
    ];

    for (const L of liste) {
      await removeFromList(L, e);
      if (old) await removeFromList(L, old);
    }

    return;
  }

  // =========================================================
  // ⭐ Cambio email → rimuovi vecchia + aggiungi nuova
  // =========================================================
  if (old && old !== e) {
    const liste = [
      LISTA_NEWSLETTER,
      LISTA_REGISTRATI,
      LISTA_CLIENTI,
      LISTA_CREDENZIALI
    ];

    for (const L of liste) {
      await removeFromList(L, old);
      await addToList(L, e);
    }
  }

  // =========================================================
  // ⭐ Registrazione
  // =========================================================
  if (registrato === true) {
    await addToList(LISTA_REGISTRATI, e);
  }

  // =========================================================
  // ⭐ Cliente
  // =========================================================
  if (cliente === true) {
    await addToList(LISTA_CLIENTI, e);
    await addToList(LISTA_REGISTRATI, e);
  }

  if (cliente === false) {
    await removeFromList(LISTA_CLIENTI, e);
  }

  // =========================================================
  // ⭐ Newsletter
  // =========================================================
  if (newsletter === true) {
    await addToList(LISTA_NEWSLETTER, e);
  }

  if (newsletter === false) {
    await removeFromList(LISTA_NEWSLETTER, e);
  }

  // =========================================================
  // ⭐ Credenziali modificate
  // =========================================================
  if (credenzialiModificate === true) {
    await addToList(LISTA_CREDENZIALI, e);
  }
}

// =========================================================
module.exports = {
  LISTA_NEWSLETTER,
  LISTA_REGISTRATI,
  LISTA_CREDENZIALI,
  LISTA_CLIENTI,

  addToList,
  removeFromList,
  syncLists,
  syncBrevoUtenteStatoReale,
  getBrevoStatoRealeUtente   // 🔥 aggiunto
};
