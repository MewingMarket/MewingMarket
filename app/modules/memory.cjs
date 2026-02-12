// modules/memory.js — VERSIONE MAX (blindata)

/*
  Struttura memoria per ogni utente:
  {
    messages: [ "testo1", "testo2", ... ],
    prefs: { chiavi dinamiche },
    ts: 1730000000000
  }
*/

const memoryStore = {};

/* =========================================================
   FUNZIONI DI SICUREZZA
========================================================= */
function safeUID(uid) {
  return typeof uid === "string" || typeof uid === "number" ? String(uid) : null;
}

function ensureMemory(uid) {
  const id = safeUID(uid);
  if (!id) return null;

  if (!memoryStore[id] || typeof memoryStore[id] !== "object") {
    memoryStore[id] = { messages: [], prefs: {}, ts: Date.now() };
  }

  return memoryStore[id];
}

/* =========================================================
   EXPORT
========================================================= */
module.exports = {
  // Aggiunge un messaggio alla memoria
  push(uid, text) {
    const mem = ensureMemory(uid);
    if (!mem) return;

    if (typeof text === "string" && text.trim() !== "") {
      mem.messages.push(text);
    }

    mem.ts = Date.now();

    // Mantieni solo gli ultimi 8 messaggi (MAX MODE)
    if (mem.messages.length > 8) {
      mem.messages = mem.messages.slice(-8);
    }
  },

  // Recupera memoria conversazionale
  get(uid) {
    const mem = ensureMemory(uid);
    if (!mem) return [];

    // Se la memoria è troppo vecchia (> 45 minuti), reset
    if (mem.ts && Date.now() - mem.ts > 45 * 60 * 1000) {
      memoryStore[uid] = { messages: [], prefs: {}, ts: Date.now() };
      return [];
    }

    return Array.isArray(mem.messages) ? mem.messages : [];
  },

  // Salva preferenze utente
  setPref(uid, key, value) {
    const mem = ensureMemory(uid);
    if (!mem) return;

    if (typeof key === "string") {
      mem.prefs[key] = value;
    }

    mem.ts = Date.now();
  },

  // Recupera preferenze
  getPrefs(uid) {
    const mem = ensureMemory(uid);
    if (!mem) return {};
    return mem.prefs || {};
  },

  // Reset totale
  reset(uid) {
    const id = safeUID(uid);
    if (!id) return;
    memoryStore[id] = { messages: [], prefs: {}, ts: Date.now() };
  }
};
